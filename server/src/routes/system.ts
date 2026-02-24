import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import os from 'os';

export const systemRouter = Router();

systemRouter.use(authenticateJWT);

systemRouter.get('/info', (req: Request, res: Response) => {
    res.json({
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        totalMem: os.totalmem(),
        freeMem: os.freemem(),
        cpus: os.cpus().length,
    });
});
