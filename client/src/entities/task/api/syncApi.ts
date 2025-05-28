/**
 * @file: syncApi.ts
 * @description: API for synchronizing tasks with the server (REST + WebSocket)
 * @dependencies: fetch, WebSocket
 * @created: 2024-06-09
 */

import { TaskModel } from "../model/TaskModel";

const API_URL = "http://localhost:3001";
const WS_URL = `ws://localhost:3001`;
let ws: WebSocket | null = null;
let reconnectTimeout: number | null = null;
const RECONNECT_DELAY = 2000; // 2 seconds

export class SyncError extends Error {
    constructor(public code: number, message: string) {
        super(message);
        this.name = 'SyncError';
    }
}

/**
 * Fetches all tasks for the authenticated user.
 * Note: Currently, the initial task load is handled via WebSocket's sync_request/sync_response.
 * This function serves as a direct HTTP GET endpoint for tasks if needed elsewhere.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to an array of tasks.
 * @throws {SyncError} If the request fails due to server error, auth error, or network issues.
 */
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
        // Ensure a SyncError is thrown for unified error handling upstream.
        throw new SyncError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Synchronizes a list of tasks with the server using an HTTP POST request.
 * This is typically called when local changes (add, update, delete, reorder) occur.
 * @param tasks The array of tasks to synchronize.
 * @param token The JWT token for authentication.
 * @returns A promise that resolves to the synchronized array of tasks from the server.
 * @throws {SyncError} If the request fails due to server error, auth error, or network issues.
 */
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
        // Ensure a SyncError is thrown for unified error handling upstream.
        // Do not return original tasks; let the caller handle the error and retry logic.
        throw new SyncError(0, `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Sets up and manages the WebSocket connection.
 * Handles initial data request, incoming updates, and automatic reconnection.
 * @param token The JWT token for authentication.
 * @param onUpdate Callback function invoked with new tasks when updates are received.
 * @param onAuthError Callback function invoked if a WebSocket operation results in an auth error.
 */
function setupWebSocket(token: string, onUpdate: (tasks: TaskModel[]) => void, onAuthError: () => void) {
    if (ws) {
        // If a WebSocket object exists, explicitly close it before creating a new one.
        // This ensures old listeners are cleaned up.
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
    }
    ws = new WebSocket(WS_URL);

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

/**
 * Connects to the WebSocket server for real-time task synchronization.
 * This function is a wrapper around setupWebSocket.
 * @param token The JWT token for authentication.
 * @param onUpdate Callback function invoked with new tasks.
 * @param onAuthError Callback function invoked on authentication errors.
 */
export function connectWebSocket(token: string, onUpdate: (tasks: TaskModel[]) => void, onAuthError: () => void) {
    // Ensure any existing reconnection timeouts are cleared before setting up a new connection.
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    setupWebSocket(token, onUpdate, onAuthError);
}

/**
 * Closes the WebSocket connection and clears any reconnection timeouts.
 */
export function closeWebSocket() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    ws?.close();
    ws = null;
} 