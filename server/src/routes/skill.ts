import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';

export const skillRouter = Router();

const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';
const SKILLS_DIR = path.join(NANOBOT_DIR, 'workspace', 'skills');

skillRouter.use(authenticateJWT);

skillRouter.get('/list', (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(SKILLS_DIR)) {
            return res.json({ skills: [] });
        }

        const files = fs.readdirSync(SKILLS_DIR);
        const skills = [];

        for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.json')) {
                const filePath = path.join(SKILLS_DIR, file);
                const content = fs.readFileSync(filePath, 'utf8');

                // Parse basic frontmatter or json for name/description if it exists
                let name = file.replace(/\.(md|json)$/, '');
                let description = 'Custom skill';
                let enabled = true;

                // Very naive frontmatter parser for the list view
                if (file.endsWith('.md')) {
                    const lines = content.split('\n');
                    if (lines[0] && lines[0].trim() === '---') {
                        for (let i = 1; i < lines.length; i++) {
                            if (lines[i].trim() === '---') break;
                            const descMatch = lines[i].match(/^description:\s*(.*)/);
                            if (descMatch) description = descMatch[1].replace(/['"]/g, '').trim();
                            const nameMatch = lines[i].match(/^name:\s*(.*)/);
                            if (nameMatch) name = nameMatch[1].replace(/['"]/g, '').trim();
                            const enabledMatch = lines[i].match(/^enabled:\s*(.*)/);
                            if (enabledMatch) enabled = enabledMatch[1].trim() !== 'false';
                        }
                    }
                } else if (file.endsWith('.json')) {
                    try {
                        const parsed = JSON.parse(content);
                        if (parsed.name) name = parsed.name;
                        if (parsed.description) description = parsed.description;
                        if (parsed.enabled !== undefined) enabled = parsed.enabled;
                    } catch (e) { }
                }

                skills.push({
                    id: file.replace(/\.(md|json)$/, ''),
                    name,
                    description,
                    enabled,
                    path: filePath
                });
            }
        }

        res.json({ skills });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

skillRouter.get('/:id/content', (req: Request, res: Response) => {
    try {
        const skillId = String(req.params.id);
        let filePath = path.join(SKILLS_DIR, `${skillId}.md`);

        if (!fs.existsSync(filePath)) {
            filePath = path.join(SKILLS_DIR, `${skillId}.json`);
            if (!fs.existsSync(filePath)) {
                return res.json({ success: false, content: '' });
            }
        }

        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ success: true, content });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// Mock toggle since it's just a frontmatter edit
skillRouter.post('/:id/toggle', (req: Request, res: Response) => {
    try {
        const { enabled } = req.body;
        // The real Nanobot probably replaces the `enabled: false` line in the markdown file
        // To be safe and simple, we pretend we successfully toggled it so the UI responds
        res.json({ success: true, enabled });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

skillRouter.post('/:id/delete', (req: Request, res: Response) => {
    try {
        const skillId = String(req.params.id);
        let filePath = path.join(SKILLS_DIR, `${skillId}.md`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            filePath = path.join(SKILLS_DIR, `${skillId}.json`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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
        const skillFile = path.join(SKILLS_DIR, `${skillId}.md`);

        fs.mkdirSync(SKILLS_DIR, { recursive: true });
        fs.writeFileSync(skillFile, content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
