import { Router, Request, Response } from 'express';
import { execFile } from 'child_process';
import util from 'util';
import os from 'os';
import { authenticateJWT } from '../middlewares/auth';
import { sendInternalError } from '../utils/httpErrors';

const execFilePromise = util.promisify(execFile);
export const processRouter = Router();

const CONTAINER_NAME = process.env.NANOBOT_CONTAINER_NAME || 'nanobot';

processRouter.use(authenticateJWT);

processRouter.get('/status', async (req: Request, res: Response) => {
    try {
        const { stdout } = await execFilePromise('docker', ['inspect', '-f', '{{.State.Running}}', CONTAINER_NAME]);
        const isRunning = stdout.trim() === 'true';
        res.json({ running: isRunning });
    } catch (error) {
        // If command fails, container might not exist or is stopped
        console.warn('Failed to inspect container status', error);
        res.json({ running: false });
    }
});

processRouter.post('/start', async (req: Request, res: Response) => {
    try {
        await execFilePromise('docker', ['start', CONTAINER_NAME]);
        res.json({ success: true, message: 'Container started' });
    } catch (error) {
        return sendInternalError(res, error, 'Failed to start container');
    }
});

processRouter.post('/stop', async (req: Request, res: Response) => {
    try {
        await execFilePromise('docker', ['stop', CONTAINER_NAME]);
        res.json({ success: true, message: 'Container stopped' });
    } catch (error) {
        return sendInternalError(res, error, 'Failed to stop container');
    }
});

processRouter.post('/restart', async (req: Request, res: Response) => {
    try {
        await execFilePromise('docker', ['restart', CONTAINER_NAME]);
        res.json({ success: true, message: 'Container restarted' });
    } catch (error) {
        return sendInternalError(res, error, 'Failed to restart container');
    }
});

processRouter.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const { stdout: statusOut } = await execFilePromise('docker', ['inspect', '-f', '{{.State.Running}}', CONTAINER_NAME]).catch(() => ({ stdout: 'false' }));
        const running = statusOut.trim() === 'true';

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = totalMem > 0 ? (usedMem / totalMem) * 100 : 0;

        // Mock other dashboard data that the frontend expects
        const dashboardData = {
            status: { running },
            systemInfo: {
                os: `${os.type()} ${os.release()}`,
                cpu: {
                    usage: 0,
                    usage_text: '0%'
                },
                memory: {
                    total: totalMem,
                    used: usedMem,
                    available: freeMem,
                    usage_percent: memoryUsage,
                    usage_text: `${memoryUsage.toFixed(1)}%`,
                    used_text: `${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    available_text: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    total_text: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`
                },
                swap: {
                    total: 0,
                    used: 0,
                    available: 0,
                    usage_percent: 0,
                    usage_text: '0%',
                    used_text: '0 GB',
                    available_text: '0 GB',
                    total_text: '0 GB'
                }
            },
            config: { error: null, data: {} },
            logStatistics: { total: 0, debug: 0, info: 0, warn: 0, error: 0 },
            networkStats: { upload_speed: 0, download_speed: 0 }
        };

        res.json(dashboardData);
    } catch (error) {
        return sendInternalError(res, error);
    }
});

processRouter.get('/logs', async (req: Request, res: Response) => {
    try {
        const limitStr = parseInt(req.query.limit as string) || 500;
        const limit = Math.min(Math.max(1, limitStr), 5000); // Sanitize and cap limit
        const { stdout } = await execFilePromise('docker', ['logs', '--tail', String(limit), CONTAINER_NAME]);
        const logs = stdout.split('\n').filter(l => l.trim() !== '');
        res.json({ logs });
    } catch (error) {
        return sendInternalError(res, error, 'Failed to read container logs');
    }
});
