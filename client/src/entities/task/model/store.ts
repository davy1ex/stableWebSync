import {create} from "zustand"
import {persist} from "zustand/middleware"
import { TaskModel } from "./TaskModel"
import { fetchTasks, syncTasks, connectWebSocket, closeWebSocket, SyncError } from "../api/syncApi"

type TaskStore = {
    tasks: TaskModel[],
    isOnline: boolean,
    pendingSync: boolean,
    authError: boolean,
    addTask: (task: TaskModel) => void,
    toggleTaskCompleted: (taskId: number) => void,
    updateTasks: (newTasks: TaskModel[]) => void,
    syncWithServer: () => Promise<void>,
    connectSync: () => void,
    disconnectSync: () => void,
    setOnline: (online: boolean) => void,
    handleAuthError: () => void
}

function getToken() {
    return localStorage.getItem('token') || ''
}

export const useTaskStore = create<TaskStore>()(
    persist(
        (set, get) => ({
            tasks: [],
            isOnline: navigator.onLine,
            pendingSync: false,
            authError: false,
            /**
             * Adds a new task to the local store and schedules a sync with the server.
             */
            addTask: (task) => {
                set((state) => ({ 
                    tasks: [...state.tasks, { ...task, updatedAt: new Date().toISOString() }],
                    pendingSync: true // Mark that there are local changes needing sync
                }))
                get().syncWithServer() // Attempt to sync immediately
            },
            /**
             * Toggles the completion status of a task and schedules a sync.
             */
            toggleTaskCompleted: (taskId) => {
                set((state) => ({
                    tasks: state.tasks.map((task) => (
                        task.taskId === taskId 
                            ? {...task, isCompleted: !task.isCompleted, updatedAt: new Date().toISOString()}
                            : task
                    )),
                    pendingSync: true // Mark for sync
                }))
                get().syncWithServer() // Attempt to sync
            },
            /**
             * Updates the entire task list (e.g., after a drag-and-drop reorder) and schedules a sync.
             * Ensures that all tasks in the new list get a fresh `updatedAt` timestamp.
             */
            updateTasks: (newTasks: TaskModel[]) => {
                const tasksWithTimestamps = newTasks.map(task => ({
                    ...task,
                    // Always assign a new timestamp on bulk updates to signify they are the latest local version.
                    updatedAt: new Date().toISOString() 
                }));
                set({ 
                    tasks: tasksWithTimestamps,
                    pendingSync: true // Mark for sync
                })
                get().syncWithServer() // Attempt to sync
            },
            /**
             * Attempts to synchronize pending local changes with the server via HTTP POST.
             * This is called automatically after local modifications or when coming back online.
             * It only proceeds if there's a token, network connection, and pending changes.
             */
            syncWithServer: async () => {
                const token = getToken()
                const { isOnline, pendingSync, tasks: localTasks } = get()
                
                if (!token || !isOnline || !pendingSync) {
                    // Log if sync is skipped and why, helps in debugging.
                    if (!token) console.warn("Sync skipped: No token");
                    if (!isOnline) console.warn("Sync skipped: Offline");
                    if (!pendingSync) console.warn("Sync skipped: No changes pending");
                    return;
                }

                try {
                    console.log("Attempting to sync tasks via HTTP POST:", localTasks);
                    const syncedTasks = await syncTasks(localTasks, token)
                    set({ tasks: syncedTasks, pendingSync: false, authError: false })
                    console.log("Tasks successfully synced. New state:", syncedTasks);
                } catch (error) {
                    if (error instanceof SyncError && error.code === 403) {
                        get().handleAuthError()
                    } else {
                        console.error('Sync via HTTP POST failed, will retry later:', error)
                        // Keep pendingSync true, so it will be retried e.g. on next modification or when coming online.
                        // No change to tasks state here, local changes are preserved.
                    }
                }
            },
            /**
             * Initializes WebSocket connection and sets up online/offline event listeners.
             * This should be called once when the authenticated user area (e.g., main board) is mounted.
             */
            connectSync: () => {
                const token = getToken()
                if (!token) {
                    console.warn("connectSync called without a token. WebSocket connection not established.");
                    return;
                }
                
                window.addEventListener('online', () => get().setOnline(true))
                window.addEventListener('offline', () => get().setOnline(false))
                
                connectWebSocket(
                    token, 
                    (tasksFromServer) => {
                        const { pendingSync, tasks: currentLocalTasks, authError } = get();
                        if (authError) return; // Do not process if in auth error state

                        console.log("WebSocket received tasks:", tasksFromServer, "Pending sync:", pendingSync);
                        if (!pendingSync) {
                            set({ tasks: tasksFromServer });
                        } else {
                            // If local changes are pending, we have a potential conflict.
                            // A robust solution would involve a proper merge strategy (e.g., CRDTs or last-write-wins based on detailed timestamps).
                            // For now, a simple approach: if the incoming tasks are identical to what we last successfully synced
                            // (or if the server confirms our pending changes), we might clear pendingSync.
                            // However, if the server sends an unsolicited update that overwrites local pending changes,
                            // it could lead to data loss without a merge.
                            // Current behavior: Log and let syncWithServer eventually try to push local changes.
                            // This might overwrite server changes if local changes are newer, or be overwritten if server changes are pushed first.
                            console.warn(
                                'WebSocket received task updates while local changes are pending. ',
                                'This may lead to conflicts. Current strategy relies on subsequent syncWithServer call.'
                            );
                            // Tentative: If server state matches current local state exactly after a presumed sync,
                            // it might mean our pending changes were accepted and reflected back.
                            if (JSON.stringify(tasksFromServer) === JSON.stringify(currentLocalTasks)) {
                                console.log("WebSocket state matches local pending state, clearing pendingSync.");
                                set({ pendingSync: false });
                            }
                        }
                    },
                    () => get().handleAuthError()
                )
            },
            /**
             * Cleans up WebSocket connection and event listeners.
             * This should be called when the authenticated user area is unmounted.
             */
            disconnectSync: () => {
                window.removeEventListener('online', () => get().setOnline(true))
                window.removeEventListener('offline', () => get().setOnline(false))
                closeWebSocket()
            },
            setOnline: (online: boolean) => {
                set({ isOnline: online })
                if (online && get().pendingSync) {
                    get().syncWithServer()
                }
            },
            handleAuthError: () => {
                set({ authError: true })
                localStorage.removeItem('token')
                localStorage.removeItem('username')
                window.location.href = '/login'
            }
        }),
        {
            name: "task-store",
        }
    )
)