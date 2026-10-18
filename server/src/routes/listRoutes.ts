/**
 * listRoutes.ts
 *
 * Which controller function answers which URL. app.ts mounts this router at
 * /api/lists, behind authenticate, so '/' here means /api/lists and every one
 * of these routes already knows who is asking.
 */
import { Router } from 'express';
import { createList, deleteList, getList } from '../controllers/listController';

const router = Router();

router.post('/', createList);
router.get('/:id', getList);
router.delete('/:id', deleteList);

export default router;
