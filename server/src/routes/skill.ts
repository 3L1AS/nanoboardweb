import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';

export const skillRouter = Router();

// We map out the workspace/skills directory
const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';
const SKILLS_DIR = path.join(NANOBOT_DIR, 'workspace', 'skills');
const SKILLS_JSON = path.join(SKILLS_DIR, 'skills.json');

skillRouter.use(authenticateJWT);

skillRouter.get('/list', (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(SKILLS_JSON)) {
            return res.json({ skills: [] });
        }
        const data = fs.readFileSync(SKILLS_JSON, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

skillRouter.get('/:id/content', (req: Request, res: Response) => {
    try {
        const skillFile = path.join(SKILLS_DIR, `${req.params.id}.json`);
        if (!fs.existsSync(skillFile)) {
            return res.json({ success: false, content: '' });
        }
        const content = fs.readFileSync(skillFile, 'utf8');
        res.json({ success: true, content });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

skillRouter.post('/:id/toggle', (req: Request, res: Response) => {
    try {
        const { enabled } = req.body;

        if (fs.existsSync(SKILLS_JSON)) {
            const data = JSON.parse(fs.readFileSync(SKILLS_JSON, 'utf8'));
            const skill = data.skills.find((s: any) => s.id === req.params.id);
            if (skill) {
                skill.enabled = enabled;
                fs.writeFileSync(SKILLS_JSON, JSON.stringify(data, null, 2), 'utf8');
            }
        }

        res.json({ success: true, enabled });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

skillRouter.post('/:id/delete', (req: Request, res: Response) => {
    try {
        if (fs.existsSync(SKILLS_JSON)) {
            const data = JSON.parse(fs.readFileSync(SKILLS_JSON, 'utf8'));
            data.skills = data.skills.filter((s: any) => s.id !== req.params.id);
            fs.writeFileSync(SKILLS_JSON, JSON.stringify(data, null, 2), 'utf8');
        }

        const skillFile = path.join(SKILLS_DIR, `${req.params.id}.json`);
        if (fs.existsSync(skillFile)) {
            fs.unlinkSync(skillFile);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

skillRouter.post('/save', (req: Request, res: Response) => {
    try {
        const { name, content } = req.body;
        const skillId = name.toLowerCase().replace(/\s+/g, '_');
        const skillFile = path.join(SKILLS_DIR, `${skillId}.json`);

        fs.mkdirSync(SKILLS_DIR, { recursive: true });
        fs.writeFileSync(skillFile, content, 'utf8');

        if (fs.existsSync(SKILLS_JSON)) {
            const data = JSON.parse(fs.readFileSync(SKILLS_JSON, 'utf8'));
            const existing = data.skills.find((s: any) => s.id === skillId);
            if (!existing) {
                data.skills.push({
                    id: skillId,
                    name: name,
                    description: "Custom skill",
                    enabled: true
                });
                fs.writeFileSync(SKILLS_JSON, JSON.stringify(data, null, 2), 'utf8');
            }
        } else {
            const data = {
                skills: [{
                    id: skillId,
                    name: name,
                    description: "Custom skill",
                    enabled: true
                }]
            };
            fs.writeFileSync(SKILLS_JSON, JSON.stringify(data, null, 2), 'utf8');
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
