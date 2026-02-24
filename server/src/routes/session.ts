import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';

export const sessionRouter = Router();

const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';
const WORKSPACE_DIR = path.join(NANOBOT_DIR, 'workspace');
const SESSIONS_FILE = path.join(WORKSPACE_DIR, 'sessions.json');

sessionRouter.use(authenticateJWT);

sessionRouter.get('/list', (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(SESSIONS_FILE)) {
            return res.json({ sessions: [] });
        }
        const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

sessionRouter.get('/memory/:id', (req: Request, res: Response) => {
    try {
        const memoryFile = path.join(WORKSPACE_DIR, 'memory', `${req.params.id}.json`);
        if (!fs.existsSync(memoryFile)) {
            return res.json({ content: '' });
        }
        const content = fs.readFileSync(memoryFile, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

sessionRouter.post('/memory/:id', (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const memoryDir = path.join(WORKSPACE_DIR, 'memory');
        const memoryFile = path.join(memoryDir, `${req.params.id}.json`);

        fs.mkdirSync(memoryDir, { recursive: true });
        fs.writeFileSync(memoryFile, content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

sessionRouter.post('/delete/:id', (req: Request, res: Response) => {
    try {
        // Read current sessions
        if (fs.existsSync(SESSIONS_FILE)) {
            const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
            const newSessions = data.sessions.filter((s: any) => s.id !== req.params.id);
            fs.writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions: newSessions }, null, 2), 'utf8');
        }

        // Delete memory file
        const memoryFile = path.join(WORKSPACE_DIR, 'memory', `${req.params.id}.json`);
        if (fs.existsSync(memoryFile)) {
            fs.unlinkSync(memoryFile);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
