/**
 * @file: syncApi.ts
 * @description: API for synchronizing tasks with the server (REST + WebSocket)
 * @dependencies: fetch, WebSocket
 * @created: 2024-06-09
 */

import { TaskModel } from "../model/TaskModel";

const API_URL = "http://localhost:3001";
let ws: WebSocket | null = null;
let reconnectTimeout: number | null = null;
const RECONNECT_DELAY = 2000; // 2 seconds

export class SyncError extends Error {
    constructor(public code: number, message: string) {
        super(message);
        this.name = 'SyncError';
    }
}

export async function fetchTasks(token: string): Promise<TaskModel[]> {
    try {
        const res = await fetch(`${API_URL}/sync`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            if (res.status === 403) {
                throw new SyncError(403, 'Authentication failed - please log in again');
            }
            throw new SyncError(res.status, `Server error: ${res.statusText}`);
        }
        const data = await res.json();
        return data.tasks;
    } catch (error) {
        if (error instanceof SyncError) throw error;
        throw new SyncError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function syncTasks(tasks: TaskModel[], token: string): Promise<TaskModel[]> {
    try {
        const res = await fetch(`${API_URL}/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tasks })
        });

        if (!res.ok) {
            if (res.status === 403) {
                throw new SyncError(403, 'Authentication failed - please log in again');
            }
            throw new SyncError(res.status, `Server error: ${res.statusText}`);
        }

        const data = await res.json();
        return data.tasks;
    } catch (error) {
        if (error instanceof SyncError) throw error;
        console.error('Sync failed:', error);
        return tasks; // Return original tasks if sync fails due to network error
    }
}

function setupWebSocket(token: string, onUpdate: (tasks: TaskModel[]) => void, onAuthError: () => void) {
    if (ws) ws.close();
    ws = new WebSocket(`ws://localhost:3001`);

    ws.onopen = () => {
        console.log('WebSocket connected');
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        ws?.send(JSON.stringify({ type: 'sync_request', token }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'task_update' || data.type === 'sync_response') {
                onUpdate(data.tasks);
            } else if (data.type === 'error' && data.code === 403) {
                onAuthError();
                closeWebSocket();
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket closed, attempting to reconnect...');
        // Schedule reconnection
        if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
                reconnectTimeout = null;
                if (token) setupWebSocket(token, onUpdate, onAuthError);
            }, RECONNECT_DELAY);
        }
    };

    return ws;
}

export function connectWebSocket(token: string, onUpdate: (tasks: TaskModel[]) => void, onAuthError: () => void) {
    return setupWebSocket(token, onUpdate, onAuthError);
}

export function closeWebSocket() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    ws?.close();
    ws = null;
} 