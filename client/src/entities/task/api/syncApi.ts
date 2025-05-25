/**
 * @file: syncApi.ts
 * @description: API for synchronizing tasks with the server (REST + WebSocket)
 * @dependencies: fetch, WebSocket
 * @created: 2024-06-09
 */

import { TaskModel } from "../model/TaskModel";

const API_URL = "http://localhost:3001";
let ws: WebSocket | null = null;

export async function fetchTasks(token: string): Promise<TaskModel[]> {
    const res = await fetch(`${API_URL}/sync`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data.tasks;
}

export async function syncTasks(tasks: TaskModel[], token: string): Promise<TaskModel[]> {
    const res = await fetch(`${API_URL}/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tasks })
    });
    const data = await res.json();
    return data.tasks;
}

export function connectWebSocket(token: string, onUpdate: (tasks: TaskModel[]) => void) {
    if (ws) ws.close();
    ws = new WebSocket(`ws://localhost:3001`);
    ws.onopen = () => {
        // You can send sync_request on connection
        ws?.send(JSON.stringify({ type: 'sync_request', token }));
    };
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'task_update' || data.type === 'sync_response') {
                onUpdate(data.tasks);
            }
        } catch {}
    };
    ws.onerror = (e) => { /* handle error */ };
    ws.onclose = () => { /* handle close */ };
    return ws;
}

export function closeWebSocket() {
    ws?.close();
    ws = null;
} 