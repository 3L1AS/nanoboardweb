import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

export const authRouter = Router();

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} must be set`);
    }
    return value;
}

export const JWT_SECRET: string = requireEnv('JWT_SECRET');

type LoginAttemptState = {
    count: number;
    windowStartedAt: number;
    blockedUntil: number;
};

const loginAttempts = new Map<string, LoginAttemptState>();
const MAX_LOGIN_ATTEMPTS = Number(process.env.NANOBOARDWEB_MAX_LOGIN_ATTEMPTS || 10);
const LOGIN_WINDOW_MS = Number(process.env.NANOBOARDWEB_LOGIN_WINDOW_MS || 15 * 60 * 1000);
const LOGIN_BLOCK_MS = Number(process.env.NANOBOARDWEB_LOGIN_BLOCK_MS || 15 * 60 * 1000);

function getClientKey(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor?.split(',')[0];
    return (forwardedIp || req.ip || req.socket.remoteAddress || 'unknown').trim();
}

function isLoginBlocked(clientKey: string): { blocked: boolean; retryAfterSec?: number } {
    const state = loginAttempts.get(clientKey);
    if (!state) return { blocked: false };

    const now = Date.now();
    if (state.blockedUntil > now) {
        return { blocked: true, retryAfterSec: Math.ceil((state.blockedUntil - now) / 1000) };
    }

    if (now - state.windowStartedAt > LOGIN_WINDOW_MS) {
        loginAttempts.delete(clientKey);
    }

    return { blocked: false };
}

function recordFailedLogin(clientKey: string) {
    const now = Date.now();
    const current = loginAttempts.get(clientKey);

    if (!current || now - current.windowStartedAt > LOGIN_WINDOW_MS) {
        loginAttempts.set(clientKey, {
            count: 1,
            windowStartedAt: now,
            blockedUntil: 0
        });
        return;
    }

    current.count += 1;
    if (current.count >= MAX_LOGIN_ATTEMPTS) {
        current.blockedUntil = now + LOGIN_BLOCK_MS;
    }
    loginAttempts.set(clientKey, current);
}

function clearFailedLogins(clientKey: string) {
    loginAttempts.delete(clientKey);
}

function constantTimePasswordMatch(input: string, expected: string): boolean {
    const a = Buffer.from(input, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) {
        const paddedA = Buffer.alloc(Math.max(a.length, b.length));
        const paddedB = Buffer.alloc(Math.max(a.length, b.length));
        a.copy(paddedA);
        b.copy(paddedB);
        crypto.timingSafeEqual(paddedA, paddedB);
        return false;
    }
    return crypto.timingSafeEqual(a, b);
}

authRouter.post('/login', (req: Request, res: Response) => {
    const { password } = req.body;
    const configuredPassword = process.env.NANOBOARDWEB_PASSWORD;
    const clientKey = getClientKey(req);

    const rateLimit = isLoginBlocked(clientKey);
    if (rateLimit.blocked) {
        return res.status(429).json({
            error: 'Too many login attempts. Please try again later.',
            retryAfter: rateLimit.retryAfterSec
        });
    }

    if (!configuredPassword) {
        return res.status(500).json({ error: 'NANOBOARDWEB_PASSWORD not configured on server' });
    }

    if (typeof password === 'string' && constantTimePasswordMatch(password, configuredPassword)) {
        clearFailedLogins(clientKey);
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
    } else {
        recordFailedLogin(clientKey);
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
