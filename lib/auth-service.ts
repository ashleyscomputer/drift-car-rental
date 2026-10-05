import { rows, write, transaction } from './mysql';
import {
  HttpError,
  hashPassword,
  verifyPassword,
  createSession,
  sameOrigin,
  failure,
} from './server-auth';
const attempts = new Map<string, { count: number; until: number }>();
export async function authenticate(request: Request, register = false) {
  try {
    sameOrigin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      password.length < 12 ||
      password.length > 128
    )
      throw new HttpError(
        400,
        'Enter a valid email and a password of 12-128 characters.',
      );
    const now = Date.now();
    for (const [key, value] of attempts)
      if (value.until < now) attempts.delete(key);
    const limit = attempts.get(email) || { count: 0, until: now + 900000 };
    if (limit.count >= 10 || attempts.size >= 10000)
      throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
    limit.count++;
    attempts.set(email, limit);
    let userId: number;
    if (register) {
      const firstName =
        typeof body.firstName === 'string' ? body.firstName.trim() : '';
      const lastName =
        typeof body.lastName === 'string' ? body.lastName.trim() : '';
      const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
      if (
        !firstName ||
        !lastName ||
        firstName.length > 80 ||
        lastName.length > 80 ||
        phone.length > 25
      )
        throw new HttpError(
          400,
          'Enter your first and last name and a valid phone number.',
        );
      const hash = await hashPassword(password);
      userId = await transaction(async (c) => {
        const customer = await write(
          'INSERT INTO Customer(first_name,last_name,email,phone) VALUES(?,?,?,?)',
          [firstName, lastName, email, phone || null],
          c,
        );
        const user = await write(
          "INSERT INTO AppUser(login_email,password_hash,customer_id,role) VALUES(?,?,?,'Customer')",
          [email, hash, customer.insertId],
          c,
        );
        return user.insertId;
      });
    } else {
      const [user] = await rows<{ user_id: number; password_hash: string }>(
        'SELECT user_id,password_hash FROM AppUser WHERE login_email=? AND is_active=1',
        [email],
      );
      const valid = await verifyPassword(
        password,
        user?.password_hash ||
          'scrypt:' + '0'.repeat(32) + ':' + '0'.repeat(128),
      );
      if (!user || !valid)
        throw new HttpError(401, 'Email or password is incorrect.');
      userId = user.user_id;
    }
    await write(
      'UPDATE AppUser SET last_login_at=UTC_TIMESTAMP() WHERE user_id=?',
      [userId],
    );
    const cookie = await createSession(userId, request);
    attempts.delete(email);
    return Response.json(
      { ok: true },
      {
        status: register ? 201 : 200,
        headers: { 'Set-Cookie': cookie, 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    if ((error as { code?: string })?.code === 'ER_DUP_ENTRY')
      return Response.json(
        {
          error: 'An account already exists for these details. Please sign in.',
        },
        { status: 409 },
      );
    return failure(error);
  }
}
