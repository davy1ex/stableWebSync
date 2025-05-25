import {create} from "zustand"
import {persist} from "zustand/middleware"
import { TaskModel } from "./TaskModel"
import { fetchTasks, syncTasks, connectWebSocket, closeWebSocket } from "../api/syncApi"

type TaskStore = {
    tasks: TaskModel[],
    addTask: (task: TaskModel) => void,
    toggleTaskCompleted: (taskId: number) => void,
    syncWithServer: () => Promise<void>,
    connectSync: () => void,
    disconnectSync: () => void
}

function getToken() {
    return localStorage.getItem('token') || ''
}

export const useTaskStore = create<TaskStore>()(
    persist(
        (set, get) => ({
            tasks: [],
            addTask: (task) => {
                set((state) => ({ tasks: [...state.tasks, { ...task, updatedAt: new Date().toISOString() }] }))
                get().syncWithServer()
            },
            toggleTaskCompleted: (taskId) => {
                set((state) => ({
                    tasks: state.tasks.map((task) => (
                        task.taskId == taskId 
                            ? {...task, isCompleted: !task.isCompleted, updatedAt: new Date().toISOString()}
                            :  task
                    ))
                }))
                get().syncWithServer()
            },
            syncWithServer: async () => {
                const token = getToken()
                if (!token) return
                const tasks = await syncTasks(get().tasks, token)
                set({ tasks })
            },
            connectSync: () => {
                const token = getToken()
                if (!token) return
                connectWebSocket(token, (tasks) => set({ tasks }))
            },
            disconnectSync: () => {
                closeWebSocket()
            }
        }),
        {
            name: "task-store",
        }
    )
)