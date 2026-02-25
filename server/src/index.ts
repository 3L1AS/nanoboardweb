import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { spawn } from 'child_process';
import jwt from 'jsonwebtoken';

import { authRouter, JWT_SECRET } from './routes/auth';
import { processRouter } from './routes/process';
import { systemRouter } from './routes/system';
import { fsRouter } from './routes/fs';
import { configRouter } from './routes/config';
import { sessionRouter } from './routes/session';
import { skillRouter } from './routes/skill';
import { cronRouter } from './routes/cron';

dotenv.config();

const app = express();
const server = createServer(app);
const defaultCorsOrigins = process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const configuredCorsOrigins = (process.env.NANOBOARDWEB_CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const allowedCorsOrigins = configuredCorsOrigins.length > 0 ? configuredCorsOrigins : defaultCorsOrigins;

const isSocketOriginAllowed = (origin?: string, hostHeader?: string | string[]) => {
    if (!origin) return true;
    if (allowedCorsOrigins.includes(origin)) return true;

    const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
    if (!host) return false;

    return origin === `http://${host}` || origin === `https://${host}`;
};

const io = new Server(server, {
    // Use allowRequest as the enforcement layer so same-origin browser clients
    // work without needing explicit host entries in NANOBOARDWEB_CORS_ORIGINS.
    cors: {
        origin: true,
    },
    allowRequest: (req, callback) => {
        callback(null, isSocketOriginAllowed(req.headers.origin, req.headers.host));
    }
});

// Settings
const PORT = process.env.PORT || 8080;

// Middleware
app.disable('x-powered-by');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedCorsOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(null, false);
    }
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/process', processRouter);
app.use('/api/system', systemRouter);
app.use('/api/fs', fsRouter);
app.use('/api/config', configRouter);
app.use('/api/session', sessionRouter);
app.use('/api/skill', skillRouter);
app.use('/api/cron', cronRouter);

// Serve static frontend files (after building Vite app)
const frontendPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendPath));

app.get('/*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Socket.io for Realtime Logs
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err: any) => {
            if (err) return next(new Error('Authentication error'));
            next();
        });
    } else {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let logProcess: any = null;

    socket.on('start-log-stream', () => {
        if (logProcess) return;
        const CONTAINER_NAME = process.env.NANOBOT_CONTAINER_NAME || 'nanobot';
        logProcess = spawn('docker', ['logs', '-f', '--tail', '1', CONTAINER_NAME]);

        logProcess.stdout.on('data', (data: any) => {
            const logs = data.toString().split('\n').filter((l: string) => l.trim() !== '');
            if (logs.length > 0) socket.emit('log-update', logs);
        });

        logProcess.stderr.on('data', (data: any) => {
            const logs = data.toString().split('\n').filter((l: string) => l.trim() !== '');
            if (logs.length > 0) socket.emit('log-update', logs);
        });
    });

    socket.on('stop-log-stream', () => {
        if (logProcess) {
            logProcess.kill();
            logProcess = null;
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (logProcess) {
            logProcess.kill();
            logProcess = null;
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
