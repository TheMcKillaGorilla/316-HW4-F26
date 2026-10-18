/**
 * passwords.ts
 *
 * Passwords are never stored, and never stored encrypted either, because
 * whatever can be decrypted can be stolen. bcrypt turns a password into a
 * one-way HASH, and the only thing anyone can do with a hash is check whether
 * a password matches it.
 *
 * Two things make bcrypt right for passwords where a fast hash like SHA-256 is
 * not. It is SALTED: a random salt is mixed in and stored inside the hash, so
 * two users with the same password get different hashes. And it is SLOW on
 * purpose (BCRYPT_ROUNDS), so guessing billions of passwords takes years.
 */
export async function hashPassword(password: string): Promise<string> {
    throw new Error('hashPassword has not been written yet');
}

export async function passwordMatches(password: string, hash: string): Promise<boolean> {
    throw new Error('passwordMatches has not been written yet');
}
