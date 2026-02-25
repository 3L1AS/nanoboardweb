import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';
import { sendInternalError } from '../utils/httpErrors';

export const configRouter = Router();

// The docker-compose mounts `/root/.nanobot` directly to `NANOBOT_DIR`
const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';
const CONFIG_PATH = path.join(NANOBOT_DIR, 'config.json');

configRouter.use(authenticateJWT);

configRouter.get('/load', (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return res.json({});
        }
        const content = fs.readFileSync(CONFIG_PATH, 'utf8');
        const config = JSON.parse(content);
        res.json(config);
    } catch (error) {
        return sendInternalError(res, error);
    }
});

configRouter.post('/save', (req: Request, res: Response) => {
    try {
        const { config } = req.body;
        fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
        res.json({ success: true });
    } catch (error) {
        return sendInternalError(res, error);
    }
});

configRouter.post('/validate', (req: Request, res: Response) => {
    try {
        // Simple mock validation for now
        const { config } = req.body;
        if (!config || typeof config !== 'object') {
            return res.json({ valid: false, errors: ['Invalid config format'] });
        }
        res.json({ valid: true });
    } catch (error) {
        return sendInternalError(res, error);
    }
});
