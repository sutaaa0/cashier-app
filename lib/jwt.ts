<<<<<<< HEAD
import * as jose from 'jose';

const secretKey = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(secretKey);

export async function createToken(payload: { userId: string; username: string; role: string }) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
=======
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function createToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '30d'
    });
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Token verification failed:', error);
        throw error;
    }
>>>>>>> 2356d831e984267b1eeff2ee7a36959fb1aedfec
}