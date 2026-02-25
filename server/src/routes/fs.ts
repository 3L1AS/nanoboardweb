import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';
import { sendInternalError } from '../utils/httpErrors';
import { isSafeLeafName, resolveWithinBase } from '../utils/pathSecurity';

export const fsRouter = Router();

const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';
const RESOLVED_NANOBOT_DIR = path.resolve(NANOBOT_DIR);

fsRouter.use(authenticateJWT);

fsRouter.get('/tree', (req: Request, res: Response) => {
    const relativePath = (req.query.path as string) || '';
    const targetPath = resolveWithinBase(RESOLVED_NANOBOT_DIR, relativePath);

    // Security check to prevent directory traversal
    if (!targetPath) {
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
        return sendInternalError(res, error);
    }
});

fsRouter.get('/content', (req: Request, res: Response) => {
    const relativePath = req.query.path as string;
    if (!relativePath) return res.status(400).json({ error: 'Path is required' });

    const targetPath = resolveWithinBase(RESOLVED_NANOBOT_DIR, relativePath);

    if (!targetPath) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const content = fs.readFileSync(targetPath, 'utf8');
        res.json({ success: true, content });
    } catch (error) {
        return sendInternalError(res, error);
    }
});

fsRouter.get('/file', (req: Request, res: Response) => {
    const relativePath = req.query.path as string;
    if (!relativePath) return res.status(400).json({ error: 'Path is required' });

    const targetPath = resolveWithinBase(RESOLVED_NANOBOT_DIR, relativePath);

    if (!targetPath) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'File not found' });
        res.sendFile(targetPath);
    } catch (error) {
        return sendInternalError(res, error);
    }
});

fsRouter.post('/save', (req: Request, res: Response) => {
    const { path: relativePath, content } = req.body;
    if (!relativePath) return res.status(400).json({ error: 'Path is required' });

    const targetPath = resolveWithinBase(RESOLVED_NANOBOT_DIR, relativePath);

    if (!targetPath) {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        return sendInternalError(res, error);
    }
});

fsRouter.post('/delete', (req: Request, res: Response) => {
    try {
        const { path: relativePath } = req.body;
        if (!relativePath) return res.status(400).json({ error: 'Path is required' });
        const targetPath = resolveWithinBase(RESOLVED_NANOBOT_DIR, relativePath);
        if (!targetPath) return res.status(403).json({ error: 'Access denied' });

        if (fs.existsSync(targetPath)) {
            if (fs.statSync(targetPath).isDirectory()) {
                fs.rmSync(targetPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(targetPath);
            }
        }
        return res.json({ success: true });
    } catch (e) {
        return sendInternalError(res, e);
    }
});

fsRouter.post('/rename', (req: Request, res: Response) => {
    try {
        const { path: relativePath, newName } = req.body;
        if (!relativePath || !newName) return res.status(400).json({ error: 'Path and newName required' });
        if (!isSafeLeafName(newName)) return res.status(400).json({ error: 'Invalid newName' });
        const targetPath = resolveWithinBase(RESOLVED_NANOBOT_DIR, relativePath);
        if (!targetPath) return res.status(403).json({ error: 'Access denied' });
        const newPath = path.join(path.dirname(targetPath), newName);
        if (!resolveWithinBase(RESOLVED_NANOBOT_DIR, path.relative(RESOLVED_NANOBOT_DIR, newPath))) return res.status(403).json({ error: 'Access denied' });

        if (fs.existsSync(targetPath)) {
            fs.renameSync(targetPath, newPath);
        }
        return res.json({ success: true });
    } catch (e) {
        return sendInternalError(res, e);
    }
});
