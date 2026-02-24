import { Router, Request, Response } from 'express';
import { execFile } from 'child_process';
import util from 'util';
import { authenticateJWT } from '../middlewares/auth';

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
        res.json({ running: false, error: String(error) });
    }
});

processRouter.post('/start', async (req: Request, res: Response) => {
    try {
        await execFilePromise('docker', ['start', CONTAINER_NAME]);
        res.json({ success: true, message: 'Container started' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

processRouter.post('/stop', async (req: Request, res: Response) => {
    try {
        await execFilePromise('docker', ['stop', CONTAINER_NAME]);
        res.json({ success: true, message: 'Container stopped' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

processRouter.post('/restart', async (req: Request, res: Response) => {
    try {
        await execFilePromise('docker', ['restart', CONTAINER_NAME]);
        res.json({ success: true, message: 'Container restarted' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

processRouter.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const { stdout: statusOut } = await execFilePromise('docker', ['inspect', '-f', '{{.State.Running}}', CONTAINER_NAME]).catch(() => ({ stdout: 'false' }));
        const running = statusOut.trim() === 'true';

        // Mock other dashboard data that the frontend expects
        const dashboardData = {
            status: { running },
            systemInfo: {
                os: 'Linux (Docker Host)',
                memory: { total: 0, used: 0 },
                cpu: { usage: 0 }
            },
            config: { error: null, data: {} },
            logStatistics: { total: 0, debug: 0, info: 0, warn: 0, error: 0 },
            networkStats: { upload_speed: 0, download_speed: 0 }
        };

        res.json(dashboardData);
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

processRouter.get('/logs', async (req: Request, res: Response) => {
    try {
        const limitStr = parseInt(req.query.limit as string) || 500;
        const limit = Math.min(Math.max(1, limitStr), 5000); // Sanitize and cap limit
        const { stdout, stderr } = await execFilePromise('docker', ['logs', '--tail', String(limit), CONTAINER_NAME]).catch(err => ({ stdout: '', stderr: String(err) }));
        const logs = [...stdout.split('\n'), ...stderr.split('\n')].filter(l => l.trim() !== '');
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
