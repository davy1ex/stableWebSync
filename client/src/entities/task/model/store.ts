import {create} from "zustand"
import {persist} from "zustand/middleware"
import { TaskModel } from "./TaskModel"
import { syncTasks, connectWebSocket, closeWebSocket, SyncError, updateTaskOnServer, deleteTaskOnServer, updateTask } from "../api/syncApi"
import { useSettingsStore } from "@/entities/settings/store"

type TaskStore = {
    tasks: TaskModel[],
    taskPoints: number,
    totalPoints: number,
    isOnline: boolean,
    pendingSync: boolean,
    authError: boolean,
    addTask: (task: TaskModel) => void,
    toggleTaskCompleted: (taskId: number) => void,
    deleteTask: (taskId: number) => void,
    updateTask: (newTask: TaskModel) => void,
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

const withoutServerSync = useSettingsStore.getState().withoutServerSync;

export const useTotalPoints = () =>
    useTaskStore(state => state.tasks.reduce((acc, t) => t.isCompleted ? acc + t.taskPoints : acc, 0));

export const useTaskStore = create<TaskStore>()(
    persist(
        (set, get) => ({
            tasks: [],
            taskPoints: 0,
            totalPoints: 0,
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
                if (!withoutServerSync) {
                    get().syncWithServer() // Attempt to sync immediately
                }
            },
            /**
             * Toggles the completion status of a task and schedules a sync.
             */
            toggleTaskCompleted: (taskId) => {
                let newCompletionStatus: boolean | undefined;
                let taskToUpdate: Partial<TaskModel> = {};

                set((state) => {
                    const totalPoints = state.tasks.reduce((acc, task) => {
                        if (task.isCompleted) {
                            return acc + task.taskPoints;
                        }
                        return acc;
                    }, 0)
                    const newTasks = state.tasks.map((task) => {
                        if (task.taskId === taskId) {
                            newCompletionStatus = !task.isCompleted;
                            taskToUpdate = { taskId, isCompleted: newCompletionStatus, updatedAt: new Date().toISOString() };
                            return { ...task, isCompleted: newCompletionStatus, updatedAt: taskToUpdate.updatedAt };
                        }
                        return task;
                    });
                    return { totalPoints: totalPoints, tasks: newTasks, pendingSync: false }; // Optimistic update, clear pendingSync for this op initially
                });
                
                const token = getToken();
                if ((!token || newCompletionStatus === undefined) && !withoutServerSync) {
                    console.warn('Toggle task skipped: No token or status change unclear');
                    // Revert or mark pending if needed, for now, log and return
                    // If we had set pendingSync true optimistically, we'd revert it here or set it based on error.
                    return;
                }

                // Send only the minimal change to the server
                const changes: Partial<TaskModel> = { isCompleted: newCompletionStatus, updatedAt: (taskToUpdate as TaskModel).updatedAt };

                if (!withoutServerSync) {
                    updateTaskOnServer(taskId, changes, token)
                        .then(syncedTaskFromServer => {
                            console.log('Task toggled successfully on server:', syncedTaskFromServer);
                            // Server response can be used to confirm/update local state further if necessary,
                            // e.g., if server modifies other fields or confirms timestamp.
                            // For now, local optimistic update is primary.
                            // If WebSocket is active, it will also push this update.
                            set(state => ({
                                tasks: state.tasks.map(t => t.taskId === syncedTaskFromServer.taskId ? syncedTaskFromServer : t),
                                pendingSync: false // Sync successful for this task
                            }))
                        })
                        .catch(error => {
                            console.error('Failed to toggle task on server:', error);
                            // An error occurred. Mark for full sync to resolve.
                            set({ pendingSync: true }); 
                            // Potentially revert optimistic update here if desired, or show error to user
                        });
                }

            },
            deleteTask: (taskId) => {
                const tasks = get().tasks
                const taskToDelete:Partial<TaskModel> | undefined = tasks.find((t:TaskModel) => t.taskId === taskId)
                const token = getToken()
                
                set((state) => ({
                    tasks: state.tasks.filter((t:TaskModel) => t.taskId !== taskId),
                    pendingSync: false
                }))

                if (!taskToDelete || !token) {
                    console.warn('Delete task skipped: No task to delete or token');
                    return;
                }

                if (!withoutServerSync) {
                    deleteTaskOnServer(taskId, token)
                        .then(syncedTaskFromServer => {
                            console.log('Task updated successfully on server:', syncedTaskFromServer);
                            set(state => ({
                            tasks: state.tasks.filter(t => t.taskId !== syncedTaskFromServer.taskId),
                            pendingSync: false // Sync successful for this task
                        }))
                        console.log('Tasks after delete:', get().tasks);
                    })
                    .catch(error => {
                        console.error('Failed to update task on server:', error);
                        set({ pendingSync: true }); // An error occurred. Mark for full sync.
                        // Optionally revert: set(state => ({ tasks: state.tasks.map(t => t.taskId === taskId ? originalTask : t) }));
                    });
                }

            },
            updateTask: (taskDataToUpdate) => { // taskDataToUpdate contains taskId and fields to change
                set((state) => ({
                    tasks: state.tasks.map(t => t.taskId === taskDataToUpdate.taskId ? taskDataToUpdate : t),
                    pendingSync: false
                }))
                if (!withoutServerSync) {
                    updateTask(taskDataToUpdate.taskId, taskDataToUpdate, getToken())
                    .then(syncedTaskFromServer => {
                        console.log('Task updated successfully on server:', syncedTaskFromServer);
                        set(state => ({
                            tasks: state.tasks.map(t => t.taskId === syncedTaskFromServer.taskId ? syncedTaskFromServer : t),
                            pendingSync: true // Sync successful for this task
                        }))
                    })
                    .catch(error => {
                    })
                }
                // const optimisticUpdatedAt = new Date().toISOString();
                // let originalTask: TaskModel | undefined;

                // set((state) => {
                //     originalTask = state.tasks.find(t => t.taskId === taskDataToUpdate.taskId);
                //     const newTasks = state.tasks.map((t) => 
                //         (t.taskId === taskDataToUpdate.taskId 
                //             ? { ...t, ...taskDataToUpdate, updatedAt: optimisticUpdatedAt } 
                //             : t)
                //    );
                //    return { tasks: newTasks, pendingSync: false }; // Optimistic update
                // });
                
                // const token = getToken();
                // if (!token || !originalTask) {
                //     console.warn('Update task skipped: No token or original task not found');
                //     return;
                // }

                // // Prepare only the fields that are actually being sent for update,
                // // excluding taskId from the body if the endpoint derives it from URL param.
                // // And ensure our optimistic updatedAt is sent so server accepts it.
                // const { taskId, ...changes } = taskDataToUpdate;
                // const payload: Partial<TaskModel> = { ...changes, updatedAt: optimisticUpdatedAt };

                // updateTaskOnServer(taskId, payload, token)
                //     .then(syncedTaskFromServer => {
                //         console.log('Task updated successfully on server:', syncedTaskFromServer);
                //         set(state => ({
                //             tasks: state.tasks.map(t => t.taskId === syncedTaskFromServer.taskId ? syncedTaskFromServer : t),
                //             pendingSync: false // Sync successful for this task
                //         }))
                //     })
                //     .catch(error => {
                //         console.error('Failed to update task on server:', error);
                //         set({ pendingSync: true }); // An error occurred. Mark for full sync.
                //         // Optionally revert: set(state => ({ tasks: state.tasks.map(t => t.taskId === taskId ? originalTask : t) }));
                //     });
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
                if (!withoutServerSync) {
                    get().syncWithServer() // Attempt to sync
                }
            },
            /**
             * Attempts to synchronize pending local changes with the server via HTTP POST.
             * This is called automatically after local modifications or when coming back online.
             * It only proceeds if there's a token, network connection, and pending changes.
             */
            syncWithServer: async () => {
                const token = getToken()
                const { isOnline, pendingSync, tasks } = get()
                console.log('Syncing with server:', tasks);
                
                if (!token || !isOnline || !pendingSync) {
                    // Log if sync is skipped and why, helps in debugging.
                    if (!token) console.warn("Sync skipped: No token");
                    if (!isOnline) console.warn("Sync skipped: Offline");
                    if (!pendingSync) console.warn("Sync skipped: No changes pending");
                    return;
                }

                try {
                    console.log("Attempting to sync tasks via HTTP POST:", tasks);
                    const syncedTasks = await syncTasks(tasks, token)
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