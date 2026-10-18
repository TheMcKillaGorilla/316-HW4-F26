/**
 * authenticate.ts
 *
 * Who is asking. Every controller that acts for a user asks currentUserId,
 * never anything the client sends in a body or URL.
 */
import type { Request } from 'express';
import { HttpError } from './errorHandlers';

/**
 * For the controllers: the logged in user's id, as req.userId holds it. With
 * no req.userId there is nobody to act for, so the answer is a 401.
 */
export function currentUserId(req: Request): string {
    if (req.userId === undefined) throw new HttpError(401, 'You need to log in first.');
    return req.userId;
}
