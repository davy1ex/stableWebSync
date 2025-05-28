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
            addTask: (task) => {
                set((state) => ({ 
                    tasks: [...state.tasks, { ...task, updatedAt: new Date().toISOString() }],
                    pendingSync: true
                }))
                get().syncWithServer()
            },
            toggleTaskCompleted: (taskId) => {
                set((state) => ({
                    tasks: state.tasks.map((task) => (
                        task.taskId == taskId 
                            ? {...task, isCompleted: !task.isCompleted, updatedAt: new Date().toISOString()}
                            : task
                    )),
                    pendingSync: true
                }))
                console.log(taskId)
                console.log(get().tasks)
                get().syncWithServer()
            },
            updateTasks: (newTasks: TaskModel[]) => {
                set((state) => ({ 
                    tasks: newTasks,
                    pendingSync: true
                }))
                get().syncWithServer()
            },
            syncWithServer: async () => {
                const token = getToken()
                const { isOnline, pendingSync } = get()
                if (!token || !isOnline || !pendingSync) return

                try {
                    const tasks = await syncTasks(get().tasks, token)
                    set({ tasks, pendingSync: false, authError: false })
                } catch (error) {
                    if (error instanceof SyncError && error.code === 403) {
                        get().handleAuthError()
                    } else {
                        console.error('Sync failed:', error)
                        // Keep pendingSync true to retry later
                    }
                }
            },
            connectSync: () => {
                const token = getToken()
                if (!token) return
                
                // Setup online/offline listeners
                window.addEventListener('online', () => get().setOnline(true))
                window.addEventListener('offline', () => get().setOnline(false))
                
                // Connect WebSocket
                connectWebSocket(
                    token, 
                    (tasks) => {
                        const { pendingSync } = get()
                        // Only update if we don't have pending changes
                        if (!pendingSync) {
                            set({ tasks })
                        }
                    },
                    () => get().handleAuthError()
                )
            },
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