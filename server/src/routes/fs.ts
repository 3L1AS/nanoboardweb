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
            return res.json({ success: true, path: relativePath, items: [] });
        }

        const items = fs.readdirSync(targetPath, { withFileTypes: true });
        const result = [];
        for (const item of items) {
            const itemPath = path.join(targetPath, item.name);
            const stat = fs.statSync(itemPath);
            result.push({
                name: item.name,
                type: stat.isDirectory() ? 'directory' : 'file',
                path: itemPath,
                size: stat.size,
                modified: Math.floor(stat.mtimeMs / 1000),
                relative_path: path.join(relativePath, item.name).replace(/\\/g, '/')
            });
        }

        res.json({ success: true, path: relativePath, items: result });
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
        res.json({ success: true, content });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

fsRouter.get('/file', (req: Request, res: Response) => {
    const relativePath = req.query.path as string;
    if (!relativePath) return res.status(400).json({ error: 'Path is required' });

    const targetPath = path.resolve(NANOBOT_DIR, relativePath);

    if (!targetPath.startsWith(path.resolve(NANOBOT_DIR))) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'File not found' });
        res.sendFile(targetPath);
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

fsRouter.post('/delete', (req: Request, res: Response) => {
    try {
        const { path: relativePath } = req.body;
        if (!relativePath) return res.status(400).json({ error: 'Path is required' });
        const targetPath = path.resolve(process.env.NANOBOT_DIR || './test_volume', relativePath);
        if (!targetPath.startsWith(path.resolve(process.env.NANOBOT_DIR || './test_volume'))) return res.status(403).json({ error: 'Access denied' });

        if (fs.existsSync(targetPath)) {
            if (fs.statSync(targetPath).isDirectory()) {
                fs.rmSync(targetPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(targetPath);
            }
        }
        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: String(e) });
    }
});

fsRouter.post('/rename', (req: Request, res: Response) => {
    try {
        const { path: relativePath, newName } = req.body;
        if (!relativePath || !newName) return res.status(400).json({ error: 'Path and newName required' });
        const targetPath = path.resolve(process.env.NANOBOT_DIR || './test_volume', relativePath);
        const newPath = path.join(path.dirname(targetPath), newName);
        if (!targetPath.startsWith(path.resolve(process.env.NANOBOT_DIR || './test_volume')) || !newPath.startsWith(path.resolve(process.env.NANOBOT_DIR || './test_volume'))) return res.status(403).json({ error: 'Access denied' });

        if (fs.existsSync(targetPath)) {
            fs.renameSync(targetPath, newPath);
        }
        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: String(e) });
    }
});