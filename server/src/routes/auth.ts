import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const authRouter = Router();

export const JWT_SECRET = process.env.JWT_SECRET || 'nanoboardweb_secret_key';

authRouter.post('/login', (req: Request, res: Response) => {
    const { password } = req.body;
    const configuredPassword = process.env.NANOBOARDWEB_PASSWORD;

    if (!configuredPassword) {
        return res.status(500).json({ error: 'NANOBOARDWEB_PASSWORD not configured on server' });
    }

    if (password === configuredPassword) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
    } else {
        return res.status(401).json({ error: 'Invalid password' });
    }
});

authRouter.get('/verify', (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ valid: false });
    }

    try {
        jwt.verify(token, JWT_SECRET);
        return res.json({ valid: true });
    } catch (err) {
        return res.status(401).json({ valid: false });
    }
});
