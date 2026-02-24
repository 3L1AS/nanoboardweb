import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import util from 'util';

const execFilePromise = util.promisify(execFile);
export const cronRouter = Router();

const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';
const CRON_DIR = path.join(NANOBOT_DIR, 'cron');
const JOBS_FILE = path.join(CRON_DIR, 'jobs.json');

cronRouter.use(authenticateJWT);

cronRouter.get('/list', (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(JOBS_FILE)) {
            return res.json({ success: true, jobs: [] });
        }

        const data = fs.readFileSync(JOBS_FILE, 'utf8');
        if (!data || data.trim() === '') {
            return res.json({ success: true, jobs: [] });
        }

        const parsed = JSON.parse(data);

        // Ensure robust return shape regardless of whether nanobot stores an array or {jobs: []} object
        const jobsList = Array.isArray(parsed) ? parsed : (parsed.jobs || []);

        res.json({ success: true, jobs: jobsList });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

cronRouter.post('/add', (req: Request, res: Response) => {
    try {
        const { job } = req.body;
        fs.mkdirSync(CRON_DIR, { recursive: true });

        let parsed: any = [];
        if (fs.existsSync(JOBS_FILE)) {
            const data = fs.readFileSync(JOBS_FILE, 'utf8');
            if (data.trim() !== '') parsed = JSON.parse(data);
        }

        const isArray = Array.isArray(parsed);
        const jobsList = isArray ? parsed : (parsed.jobs || []);

        job.id = `job_${Date.now()}`;
        jobsList.push(job);

        const output = isArray ? jobsList : { ...parsed, jobs: jobsList };
        fs.writeFileSync(JOBS_FILE, JSON.stringify(output, null, 2), 'utf8');
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

cronRouter.post('/update', (req: Request, res: Response) => {
    try {
        const { job } = req.body;

        if (fs.existsSync(JOBS_FILE)) {
            const data = fs.readFileSync(JOBS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            const isArray = Array.isArray(parsed);
            const jobsList = isArray ? parsed : (parsed.jobs || []);

            const index = jobsList.findIndex((j: any) => j.id === job.id);
            if (index !== -1) {
                jobsList[index] = { ...jobsList[index], ...job };
                const output = isArray ? jobsList : { ...parsed, jobs: jobsList };
                fs.writeFileSync(JOBS_FILE, JSON.stringify(output, null, 2), 'utf8');
                return res.json({ success: true, job: jobsList[index] });
            }
        }

        res.status(404).json({ error: 'Job not found' });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

cronRouter.post('/remove', (req: Request, res: Response) => {
    try {
        const { id } = req.body;

        if (fs.existsSync(JOBS_FILE)) {
            const data = fs.readFileSync(JOBS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            const isArray = Array.isArray(parsed);
            let jobsList = isArray ? parsed : (parsed.jobs || []);

            jobsList = jobsList.filter((j: any) => j.id !== id);

            const output = isArray ? jobsList : { ...parsed, jobs: jobsList };
            fs.writeFileSync(JOBS_FILE, JSON.stringify(output, null, 2), 'utf8');
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

cronRouter.post('/enable', (req: Request, res: Response) => {
    try {
        const { id, disable } = req.body;

        if (fs.existsSync(JOBS_FILE)) {
            const data = fs.readFileSync(JOBS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            const isArray = Array.isArray(parsed);
            const jobsList = isArray ? parsed : (parsed.jobs || []);

            const job = jobsList.find((j: any) => j.id === id);
            if (job) {
                job.enabled = !disable;
                const output = isArray ? jobsList : { ...parsed, jobs: jobsList };
                fs.writeFileSync(JOBS_FILE, JSON.stringify(output, null, 2), 'utf8');
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

cronRouter.post('/run', async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        const CONTAINER_NAME = process.env.NANOBOT_CONTAINER_NAME || 'nanobot';

        await execFilePromise('docker', ['exec', CONTAINER_NAME, 'python', '-m', 'nanobot.cron', '--run', id]);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
