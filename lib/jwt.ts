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
}