import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';

export const fsRouter = Router();

const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';

fsRouter.use(authenticateJWT);

fsRouter.get('/tree', (req: Request, res: Response) => {
    const relativePath = (req.query.path as string) || '';
    const targetPath = path.join(NANOBOT_DIR, relativePath);

    // Security check to prevent directory traversal
    if (!targetPath.startsWith(path.resolve(NANOBOT_DIR))) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        if (!fs.existsSync(targetPath)) {
            return res.json([]);
        }

        const items = fs.readdirSync(targetPath, { withFileTypes: true });
        const result = items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(relativePath, item.name).replace(/\\/g, '/')
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

fsRouter.get('/content', (req: Request, res: Response) => {
    const relativePath = req.query.path as string;
    if (!relativePath) return res.status(400).json({ error: 'Path is required' });

    const targetPath = path.resolve(NANOBOT_DIR, relativePath);

    if (!targetPath.startsWith(path.resolve(NANOBOT_DIR))) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const content = fs.readFileSync(targetPath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

fsRouter.post('/save', (req: Request, res: Response) => {
    const { path: relativePath, content } = req.body;
    if (!relativePath) return res.status(400).json({ error: 'Path is required' });

    const targetPath = path.resolve(NANOBOT_DIR, relativePath);

    if (!targetPath.startsWith(path.resolve(NANOBOT_DIR))) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
