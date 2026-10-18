/**
 * listController.ts
 *
 * The C in MVC. Each function handles one kind of request: it reads what it
 * needs from req, asks PostgreSQL for data in SQL, and sends back a DTO.
 *
 * Every query is scoped to its OWNER, the user authenticate let through:
 * WHERE owner_id = $1 is on every one of them. A list belonging to somebody
 * else is not forbidden, it is simply never found, so the answer is the same
 * 404 as for a list that does not exist at all and nobody can even learn that
 * it is there.
 *
 * None of these catch errors. Anything thrown, including by the database,
 * Express 5 passes along to errorHandler.
 */
import type { Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { DEFAULT_LIST_NAME, type ListDTO, type ListMetadata } from '@wolfie-lists/shared';
import { query } from '../db';
import { toListJSON, type ItemRow, type MetadataRow } from '../dto/listDTO';
import { buildUnusedName, isUuid } from '../rules';
import { currentUserId } from '../middleware/authenticate';
import { HttpError } from '../middleware/errorHandlers';

const NO_SUCH_LIST = 'There is no list with that id.';

/** GET /api/lists/:id, one whole list, for editing */
export async function getList(req: Request, res: Response<ListDTO>) {
    const list = await findMyList(req);
    const items = await query<ItemRow>(
        'SELECT * FROM items WHERE list_id = $1 ORDER BY position', [list.id]);
    res.json(toListJSON(list, items));
}

/** POST /api/lists, a new empty list at the bottom of the home screen */
export async function createList(req: Request, res: Response<ListMetadata>) {
    const owner = currentUserId(req);
    const name = buildUnusedName(await myListNames(owner), DEFAULT_LIST_NAME);

    // the subquery finds the bottom of the home screen as the row goes in
    const [list] = await query<{ id: string; name: string }>(
        `INSERT INTO lists (owner_id, name, position)
         VALUES ($1, $2, (SELECT coalesce(max(position), -1) + 1 FROM lists WHERE owner_id = $1))
         RETURNING id, name`,
        [owner, name]);
    res.status(201).json({ id: list.id, name: list.name, itemCount: 0, completedCount: 0 });
}

/** DELETE /api/lists/:id; the database deletes its items too (ON DELETE CASCADE) */
export async function deleteList(req: Request, res: Response) {
    const id = String(req.params.id);
    const deleted = isUuid(id)
        ? await query('DELETE FROM lists WHERE id = $1 AND owner_id = $2 RETURNING id', [id, currentUserId(req)])
        : [];
    if (deleted.length === 0) throw new HttpError(404, NO_SUCH_LIST);
    res.status(204).end();
}

/** the list named in the URL, if and only if it belongs to the user asking */
async function findMyList(req: Request) {
    const id = String(req.params.id);
    // anything that is not even shaped like a uuid cannot name a list, and
    // PostgreSQL would refuse to compare it with one
    if (!isUuid(id)) throw new HttpError(404, NO_SUCH_LIST);

    const [list] = await query<{ id: string; name: string; position: number }>(
        'SELECT id, name, position FROM lists WHERE id = $1 AND owner_id = $2', [id, currentUserId(req)]);
    if (list === undefined) throw new HttpError(404, NO_SUCH_LIST);
    return list;
}

async function myListNames(owner: string): Promise<string[]> {
    const rows = await query<{ name: string }>('SELECT name FROM lists WHERE owner_id = $1', [owner]);
    return rows.map((row) => row.name);
}

/**
 * For duplicateList: copies every item of one list into another, each with a
 * new id, inside the caller's transaction, and returns the copy's metadata row.
 *
 * INSERT ... SELECT copies all the rows in one statement, and WITH lets the
 * same statement count what it just inserted, so there is no second query.
 */
async function copyItems(client: PoolClient, fromListId: string, toList: { id: string; name: string }) {
    const { rows: [counts] } = await client.query<MetadataRow>(
        `WITH copied AS (
             INSERT INTO items (list_id, id, position, description, date_entered, priority, target_date, completed)
             SELECT $1, 'item-' || gen_random_uuid(), position, description, date_entered, priority, target_date, completed
               FROM items WHERE list_id = $2
             RETURNING completed
         )
         SELECT $1 AS id, $3 AS name, count(*) AS item_count,
                count(*) FILTER (WHERE completed) AS completed_count
           FROM copied`,
        [toList.id, fromListId, toList.name]);
    return counts;
}
