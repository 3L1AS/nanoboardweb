import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';

export const skillRouter = Router();

const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';
const SKILLS_DIR = path.join(NANOBOT_DIR, 'workspace', 'skills');

skillRouter.use(authenticateJWT);

function getSkillFilePath(skillId: string): string | null {
    const dirPath = path.join(SKILLS_DIR, skillId);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath);
        const mdFile = files.find(f => f.endsWith('.md')) || files.find(f => f.endsWith('.json'));
        if (mdFile) return path.join(dirPath, mdFile);
    } else {
        const mdPath = path.join(SKILLS_DIR, `${skillId}.md`);
        if (fs.existsSync(mdPath)) return mdPath;
        const jsonPath = path.join(SKILLS_DIR, `${skillId}.json`);
        if (fs.existsSync(jsonPath)) return jsonPath;
    }
    return null;
}

skillRouter.get('/list', (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(SKILLS_DIR)) {
            return res.json({ skills: [] });
        }

        const files = fs.readdirSync(SKILLS_DIR);
        const skills = [];

        for (const file of files) {
            const filePath = path.join(SKILLS_DIR, file);
            let stat;
            try {
                stat = fs.statSync(filePath);
            } catch (e) { continue; }

            let contentPath = filePath;
            let id = file;

            if (stat.isDirectory()) {
                const dirFiles = fs.readdirSync(filePath);
                const mdFile = dirFiles.find(f => f.endsWith('.md')) || dirFiles.find(f => f.endsWith('.json'));
                if (mdFile) {
                    contentPath = path.join(filePath, mdFile);
                } else {
                    continue; // Skip directories without readable skill files
                }
            } else if (!file.endsWith('.md') && !file.endsWith('.json')) {
                continue;
            } else {
                id = file.replace(/\.(md|json)$/, '');
            }

            const content = fs.readFileSync(contentPath, 'utf8');

            // Parse basic frontmatter or json for name/description if it exists
            let name = file;
            if (!stat.isDirectory()) name = file.replace(/\.(md|json)$/, '');
            let description = 'Custom skill';
            let enabled = true;

            if (contentPath.endsWith('.md')) {
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
            } else if (contentPath.endsWith('.json')) {
                try {
                    const parsed = JSON.parse(content);
                    if (parsed.name) name = parsed.name;
                    if (parsed.description) description = parsed.description;
                    if (parsed.enabled !== undefined) enabled = parsed.enabled;
                } catch (e) { }
            }

            skills.push({
                id,
                name,
                description,
                enabled,
                path: filePath,
                modified: Math.floor(stat.mtimeMs / 1000)
            });
        }

        res.json({ skills });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

skillRouter.get('/:id/content', (req: Request, res: Response) => {
    try {
        const skillId = String(req.params.id);
        const filePath = getSkillFilePath(skillId);

        if (!filePath) {
            return res.json({ success: false, content: '' });
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
        res.json({ success: true, enabled });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

skillRouter.post('/:id/delete', (req: Request, res: Response) => {
    try {
        const skillId = String(req.params.id);
        const dirPath = path.join(SKILLS_DIR, skillId);

        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        } else {
            const filePath = getSkillFilePath(skillId);
            if (filePath) fs.unlinkSync(filePath);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

skillRouter.post('/save', (req: Request, res: Response) => {
    try {
        const { name, content } = req.body;

        // Find if this name matches an existing skill to overwrite it
        let skillId = name.toLowerCase().replace(/\s+/g, '_');
        let isExistingDirectory = false;

        if (fs.existsSync(SKILLS_DIR)) {
            const files = fs.readdirSync(SKILLS_DIR);
            // We do a naive search for matching name in frontmatter to find the true directory ID
            // but for simplicity, we'll check if a directory/file matches the slugified id
            if (fs.existsSync(path.join(SKILLS_DIR, skillId)) && fs.statSync(path.join(SKILLS_DIR, skillId)).isDirectory()) {
                isExistingDirectory = true;
            }
        }

        fs.mkdirSync(SKILLS_DIR, { recursive: true });

        if (isExistingDirectory) {
            const dirPath = path.join(SKILLS_DIR, skillId);
            const files = fs.readdirSync(dirPath);
            const mdFile = files.find(f => f.endsWith('.md')) || 'SKILL.md';
            fs.writeFileSync(path.join(dirPath, mdFile), content, 'utf8');
        } else {
            const skillFile = path.join(SKILLS_DIR, `${skillId}.md`);
            fs.writeFileSync(skillFile, content, 'utf8');
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

