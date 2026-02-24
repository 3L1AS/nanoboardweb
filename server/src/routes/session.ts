import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';

export const sessionRouter = Router();

const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';
const WORKSPACE_DIR = path.join(NANOBOT_DIR, 'workspace');

sessionRouter.use(authenticateJWT);

sessionRouter.get('/list', (req: Request, res: Response) => {
    try {
        const memoryDir = path.join(WORKSPACE_DIR, 'memory');
        if (!fs.existsSync(memoryDir)) {
            return res.json({ sessions: [] });
        }

        const files = fs.readdirSync(memoryDir);
        const sessions = [];

        for (const file of files) {
            if (file.endsWith('.json') || file.endsWith('.md')) {
                const filePath = path.join(memoryDir, file);
                const stat = fs.statSync(filePath);
                sessions.push({
                    id: file,
                    name: file.replace(/\.(json|md)$/, ''),
                    path: filePath,
                    modified: Math.floor(stat.mtimeMs / 1000),
                    size: stat.size
                });
            }
        }

        sessions.sort((a, b) => b.modified - a.modified);

        res.json({ sessions, total: sessions.length });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

sessionRouter.get('/memory/:id', (req: Request, res: Response) => {
    try {
        const memoryFile = path.join(WORKSPACE_DIR, 'memory', String(req.params.id));
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
        const memoryFile = path.join(memoryDir, String(req.params.id));

        fs.mkdirSync(memoryDir, { recursive: true });
        fs.writeFileSync(memoryFile, content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

sessionRouter.post('/delete/:id', (req: Request, res: Response) => {
    try {
        const memoryFile = path.join(WORKSPACE_DIR, 'memory', String(req.params.id));
        if (fs.existsSync(memoryFile)) {
            fs.unlinkSync(memoryFile);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
