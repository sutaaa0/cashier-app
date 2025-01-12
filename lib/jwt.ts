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
}