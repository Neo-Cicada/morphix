import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ status: 'error', message: 'Missing or invalid authorization header' });
        return;
    }

    const token = authHeader.slice(7);
    const publicKey = process.env.SUPABASE_JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');

    if (!publicKey) {
        console.error('SUPABASE_JWT_PUBLIC_KEY is not set');
        res.status(500).json({ status: 'error', message: 'Server configuration error' });
        return;
    }

    try {
        const payload = jwt.verify(token, publicKey, { algorithms: ['ES256'] }) as jwt.JwtPayload;

        req.user = {
            id: payload.sub as string,
            email: payload.email as string,
            role: payload.role as string,
        };

        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ status: 'error', message: 'Token expired' });
        } else if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ status: 'error', message: 'Invalid token' });
        } else {
            next(err);
        }
    }
};
