import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';

export const sessionRouter = Router();

const NANOBOT_DIR = process.env.NANOBOT_DIR || './test_volume';
const WORKSPACE_DIR = path.join(NANOBOT_DIR, 'workspace');

sessionRouter.use(authenticateJWT);

function getSessionFilePath(baseDir: string, sessionId: string): string | null {
    const dirPath = path.join(baseDir, sessionId);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath);
        const mdFile = files.find(f => f.endsWith('.md')) || files.find(f => f.endsWith('.json')) || files.find(f => f.endsWith('.jsonl'));
        if (mdFile) return path.join(dirPath, mdFile);
    } else {
        const mdPath = path.join(baseDir, `${sessionId}.md`);
        if (fs.existsSync(mdPath)) return mdPath;
        const jsonPath = path.join(baseDir, `${sessionId}.json`);
        if (fs.existsSync(jsonPath)) return jsonPath;
        const jsonlPath = path.join(baseDir, `${sessionId}.jsonl`);
        if (fs.existsSync(jsonlPath)) return jsonlPath;
        const exactPath = path.join(baseDir, sessionId);
        if (fs.existsSync(exactPath)) return exactPath;
    }
    return null;
}

// ================= MEMORY API =================

sessionRouter.get('/list', (req: Request, res: Response) => {
    try {
        const memoryDir = path.join(WORKSPACE_DIR, 'memory');
        if (!fs.existsSync(memoryDir)) {
            return res.json({ sessions: [] });
        }

        const files = fs.readdirSync(memoryDir);
        const sessions = [];

        for (const file of files) {
            const filePath = path.join(memoryDir, file);
            let stat;
            try {
                stat = fs.statSync(filePath);
            } catch (e) { continue; }

            if (stat.isDirectory() || file.endsWith('.json') || file.endsWith('.jsonl') || file.endsWith('.md')) {
                sessions.push({
                    id: file,
                    name: stat.isDirectory() ? file : file.replace(/\.(json|jsonl|md)$/, ''),
                    path: filePath,
                    modified: Math.floor(stat.mtimeMs / 1000),
                    size: stat.size
                });
            }
        }

        sessions.sort((a, b) => b.modified - a.modified);
        res.json({ sessions, total: sessions.length });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

sessionRouter.get('/memory/:id', (req: Request, res: Response) => {
    try {
        const memoryDir = path.join(WORKSPACE_DIR, 'memory');
        const filePath = getSessionFilePath(memoryDir, String(req.params.id));

        if (!filePath) {
            return res.json({ content: '' });
        }
        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

sessionRouter.post('/memory/:id', (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const memoryDir = path.join(WORKSPACE_DIR, 'memory');
        const sessionId = String(req.params.id);

        let filePath = getSessionFilePath(memoryDir, sessionId);
        if (!filePath) {
            // New memory
            filePath = path.join(memoryDir, sessionId.endsWith('.md') || sessionId.endsWith('.json') || sessionId.endsWith('.jsonl') ? sessionId : `${sessionId}.md`);
        }

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

sessionRouter.post('/delete/:id', (req: Request, res: Response) => {
    try {
        const memoryDir = path.join(WORKSPACE_DIR, 'memory');
        const sessionId = String(req.params.id);

        const dirPath = path.join(memoryDir, sessionId);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            fs.rmSync(dirPath, { recursive: true, force: true });
        } else {
            const filePath = getSessionFilePath(memoryDir, sessionId);
            if (filePath) fs.unlinkSync(filePath);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

// ================= CHAT SESSION API =================

sessionRouter.get('/chat/list', (req: Request, res: Response) => {
    try {
        const chatDir = path.join(WORKSPACE_DIR, 'sessions');
        if (!fs.existsSync(chatDir)) {
            return res.json({ sessions: [] });
        }

        const files = fs.readdirSync(chatDir);
        const sessions = [];

        for (const file of files) {
            const filePath = path.join(chatDir, file);
            let stat;
            try {
                stat = fs.statSync(filePath);
            } catch (e) { continue; }

            if (stat.isDirectory() || file.endsWith('.json') || file.endsWith('.jsonl') || file.endsWith('.md')) {
                sessions.push({
                    id: file,
                    name: stat.isDirectory() ? file : file.replace(/\.(json|jsonl|md)$/, ''),
                    title: `Session ${stat.isDirectory() ? file : file.replace(/\.(json|jsonl|md)$/, '')}`,
                    path: filePath,
                    modified: Math.floor(stat.mtimeMs / 1000),
                    size: stat.size
                });
            }
        }

        sessions.sort((a, b) => b.modified - a.modified);
        res.json({ sessions, total: sessions.length });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

sessionRouter.get('/chat/:id', (req: Request, res: Response) => {
    try {
        const chatDir = path.join(WORKSPACE_DIR, 'sessions');
        const filePath = getSessionFilePath(chatDir, String(req.params.id));

        if (!filePath) {
            return res.json({ success: false, messages: [], message: 'Not found' });
        }

        // Let's try to parse the file. Nanobot sessions are usually JSON arrays or objects
        const content = fs.readFileSync(filePath, 'utf8');
        let messages = [];
        try {
            if (filePath.endsWith('.jsonl')) {
                messages = content.split('\\n')
                    .filter(line => line.trim() !== '')
                    .map(line => {
                        try {
                            const parsed = JSON.parse(line);
                            return {
                                role: parsed.role || 'system',
                                content: typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content || parsed)
                            };
                        } catch (e) {
                            return null;
                        }
                    })
                    .filter(m => m !== null);
            } else {
                const parsed = JSON.parse(content);
                // Adapt based on typical Nanobot session format
                if (Array.isArray(parsed)) {
                    // If the array itself is messages
                    messages = parsed;
                } else if (parsed.messages && Array.isArray(parsed.messages)) {
                    messages = parsed.messages;
                } else if (parsed.history && Array.isArray(parsed.history)) {
                    messages = parsed.history;
                } else {
                    // Fallback, just render it as a system message
                    messages = [{ role: 'system', content: `Raw JSON data from ${path.basename(filePath)}\\n\`\`\`json\\n${JSON.stringify(parsed, null, 2)}\\n\`\`\`` }];
                }

                // Normalize message format
                messages = messages.map((m: any) => ({
                    role: m.role || 'system',
                    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content || m)
                }));
            }

        } catch (e) {
            // Not JSON, return as markdown
            messages = [
                { role: 'system', content: `Raw content from ${path.basename(filePath)}` },
                { role: 'assistant', content }
            ];
        }

        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
