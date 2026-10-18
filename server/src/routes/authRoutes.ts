/**
 * authRoutes.ts
 *
 * Mounted at /api/auth, and the one router NOT behind authenticate: nobody has
 * a token before they register or log in.
 */
import { Router } from 'express';
import { logout, register } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/logout', logout);

export default router;
