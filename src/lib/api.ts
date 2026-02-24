import { io, Socket } from 'socket.io-client';

// Use VITE_API_URL if provided, else in DEV use localhost:8080, else in PROD use relative /api
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080/api' : '/api');

const getAuthHeaders = () => {
    const token = localStorage.getItem('nanoboardweb_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (res: Response) => {
    if (res.status === 401) {
        localStorage.removeItem('nanoboardweb_token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'API Request failed');
    }
    return data;
};

// --- AUTH API ---
export const login = async (password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    return handleResponse(res);
};

// --- PROCESS API (Docker) ---
export const processApi = {
    getDashboardData: async () => {
        const res = await fetch(`${API_URL}/process/dashboard`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    start: async (_port?: number) => {
        const res = await fetch(`${API_URL}/process/start`, { method: 'POST', headers: getAuthHeaders() });
        return handleResponse(res);
    },
    stop: async () => {
        const res = await fetch(`${API_URL}/process/stop`, { method: 'POST', headers: getAuthHeaders() });
        return handleResponse(res);
    },
    getVersion: async () => {
        return { installed: true, version: '1.0.0 (Web)', message: '' };
    },
    checkOAuthToken: async (_provider: string) => {
        // Web version does not use local OAuth server, always return no token for now
        return { has_token: false, is_expired: false, message: 'Not supported in Web mode' };
    },
    getSystemInfo: async () => {
        const res = await fetch(`${API_URL}/system/info`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    getNanobotPath: async () => { return { path: '/var/nanobot' } as any; },
    diagnose: async () => { return { overall: 'passed', checks: [] } as any; },
    downloadWithUv: async () => { return { status: 'success' } as any; },
    download: async () => { return { status: 'success' } as any; },
    onboard: async () => { return { success: true } as any; },
    getStatus: async () => { return { running: true } as any; },
    checkConfig: async () => { return { valid: true } as any; },
    providerLogin: async (_cmd: string) => { return { success: true } as any; }
};

// --- FS API ---
export const fsApi = {
    getDirectoryTree: async (path = '') => {
        const res = await fetch(`${API_URL}/fs/tree?path=${path}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    getFileContent: async (path: string) => {
        const res = await fetch(`${API_URL}/fs/content?path=${path}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    saveFile: async (path: string, content: string) => {
        const res = await fetch(`${API_URL}/fs/save`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ path, content })
        });
        return handleResponse(res);
    },
    deleteFile: async (path: string) => {
        const res = await fetch(`${API_URL}/fs/delete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ path, isFile: true })
        });
        return handleResponse(res);
    },
    deleteFolder: async (path: string) => {
        const res = await fetch(`${API_URL}/fs/delete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ path, isFile: false })
        });
        return handleResponse(res);
    },
    renameItem: async (path: string, newName: string) => {
        const res = await fetch(`${API_URL}/fs/rename`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ path, newName })
        });
        return handleResponse(res);
    }
};

// --- CONFIG API ---
export const configApi = {
    load: async () => {
        const res = await fetch(`${API_URL}/config/load`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    save: async (config: any) => {
        const res = await fetch(`${API_URL}/config/save`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ config })
        });
        return handleResponse(res);
    },
    validate: async (config: any) => {
        const res = await fetch(`${API_URL}/config/validate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ config })
        });
        return handleResponse(res);
    },
    getHistory: async () => {
        return [];
    },
    restoreVersion: async (_filename: string) => {
        return Promise.resolve();
    },
    deleteVersion: async (_filename: string) => {
        return Promise.resolve();
    }
};

// --- NETWORK API ---
export const networkApi = {
    initMonitor: async () => Promise.resolve(),
};

// --- SESSION API ---
export const sessionApi = {
    list: async () => {
        const res = await fetch(`${API_URL}/session/list`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    getMemory: async (id: string) => {
        const res = await fetch(`${API_URL}/session/memory/${id}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    saveMemory: async (id: string, content: string) => {
        const res = await fetch(`${API_URL}/session/memory/${id}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        return handleResponse(res);
    },
    delete: async (id: string) => {
        const res = await fetch(`${API_URL}/session/delete/${id}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    }
};

// --- SKILL API ---
export const skillApi = {
    list: async () => {
        const res = await fetch(`${API_URL}/skill/list`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    getContent: async (id: string) => {
        const res = await fetch(`${API_URL}/skill/${id}/content`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    toggle: async (id: string, enabled: boolean) => {
        const res = await fetch(`${API_URL}/skill/${id}/toggle`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ enabled })
        });
        return handleResponse(res);
    },
    delete: async (id: string) => {
        const res = await fetch(`${API_URL}/skill/${id}/delete`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return handleResponse(res);
    },
    save: async (name: string, content: string) => {
        const res = await fetch(`${API_URL}/skill/save`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, content })
        });
        return handleResponse(res);
    }
};

// --- CHAT SESSION API ---
export const chatSessionApi = {
    list: async () => { return { sessions: [] }; },
    getContent: async (_id: string) => { return { success: true, messages: [] }; }
};

// --- CRON API ---
export const cronApi = {
    list: async () => {
        const res = await fetch(`${API_URL}/cron/list`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    add: async (job: any) => {
        const res = await fetch(`${API_URL}/cron/add`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ job })
        });
        return handleResponse(res);
    },
    update: async (job: any) => {
        const res = await fetch(`${API_URL}/cron/update`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ job })
        });
        return handleResponse(res);
    },
    remove: async (id: string) => {
        const res = await fetch(`${API_URL}/cron/remove`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id })
        });
        return handleResponse(res);
    },
    enable: async (id: string, disable: boolean) => {
        const res = await fetch(`${API_URL}/cron/enable`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, disable })
        });
        return handleResponse(res);
    },
    run: async (id: string) => {
        const res = await fetch(`${API_URL}/cron/run`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id })
        });
        return handleResponse(res);
    }
};

// --- THEME API ---
export const themeApi = {
    setTheme: async (_theme: string) => { return Promise.resolve(); },
    toggleTheme: async () => { return Promise.resolve(null); }
};

// --- LOGGER API ---
let socket: Socket | null = null;
let streamRunning = false;
let logListeners: ((logs: string[]) => void)[] = [];

function getSocket() {
    if (!socket) {
        // Find the base URL for the socket connection by stripping the /api suffix (or keeping empty string for relative paths)
        const socketUrl = API_URL === '/api' ? '' : API_URL.replace(/\/api$/, '');
        socket = io(socketUrl, {
            auth: { token: localStorage.getItem('nanoboardweb_token') }
        });
        socket.on('log-update', (logs: string[]) => {
            logListeners.forEach(listener => listener(logs));
        });
    }
    return socket;
}

export const loggerApi = {
    getLogs: async (limit: number = 500) => {
        const res = await fetch(`${API_URL}/process/logs?limit=${limit}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },
    startStream: async () => {
        const s = getSocket();
        s.emit('start-log-stream');
        streamRunning = true;
        return Promise.resolve();
    },
    stopStream: async () => {
        if (socket) {
            socket.emit('stop-log-stream');
        }
        streamRunning = false;
        return Promise.resolve();
    },
    isStreamRunning: async () => { return Promise.resolve(streamRunning); }
};

// --- EVENTS ---
export const events = {
    onLogUpdate: async (callback: (newLogs: string[]) => void) => {
        logListeners.push(callback);
        return () => {
            logListeners = logListeners.filter(l => l !== callback);
        };
    }
};

export default {
    login,
    processApi,
    fsApi,
    networkApi,
    configApi,
    sessionApi,
    skillApi,
    chatSessionApi,
    cronApi,
    themeApi,
    loggerApi,
    events
};

