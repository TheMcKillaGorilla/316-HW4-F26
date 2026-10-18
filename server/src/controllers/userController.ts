/**
 * userController.ts
 *
 * The logged in user's own account. Every route here is behind authenticate,
 * and every one of them is about "me": there is no route that takes another
 * user's id, so there is no way to ask about anyone else.
 */
import type { Request, Response } from 'express';
import type { UserDTO } from '@wolfie-lists/shared';
import { query } from '../db';
import { toUserJSON, USER_COLUMNS, type UserRow } from '../dto/userDTO';
import { currentUserId } from '../middleware/authenticate';
import { HttpError } from '../middleware/errorHandlers';

/** GET /api/users/me, which is also how the client asks "am I logged in?" */
export async function getMe(req: Request, res: Response<UserDTO>) {
    const [user] = await query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [currentUserId(req)]);
    res.json(toUserJSON(existing(user)));
}

/** GET /api/users/me/avatar, the image itself */
export async function getAvatar(req: Request, res: Response) {
    const [user] = await query<{ avatar: Buffer | null; avatar_type: string | null }>(
        'SELECT avatar, avatar_type FROM users WHERE id = $1', [currentUserId(req)]);
    const { avatar, avatar_type: type } = existing(user);
    if (avatar === null || type === null) throw new HttpError(404, 'You have not uploaded an avatar.');

    res.type(type)
        // the URL changes with every upload (see userDTO.ts), so a cached copy is never stale
        .set('Cache-Control', 'private, max-age=86400')
        // never let the browser guess the type from the bytes
        .set('X-Content-Type-Options', 'nosniff')
        .send(avatar);
}

/** PUT /api/users/me/avatar, multipart with one file named avatar (see uploadAvatar.ts) */
export async function setAvatar(req: Request, res: Response<UserDTO>) {
    if (req.file === undefined) throw new HttpError(400, 'Choose an image to upload.');

    // a Buffer goes into a bytea column as it is
    const [user] = await query<UserRow>(
        `UPDATE users SET avatar = $1, avatar_type = $2, avatar_updated_at = now()
          WHERE id = $3 RETURNING ${USER_COLUMNS}`,
        [req.file.buffer, req.file.mimetype, currentUserId(req)]);
    res.json(toUserJSON(existing(user)));
}

/**
 * The token said who this is, but the account may have gone since it was made,
 * in which case the token is no longer good for anything.
 */
function existing<Row>(user: Row | undefined): Row {
    if (user === undefined) throw new HttpError(401, 'You need to log in first.');
    return user;
}
