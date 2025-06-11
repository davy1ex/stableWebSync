import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { TaskModel } from "./TaskModel";
import { useSyncStore } from "@/features/sync";

import { usePointsStore } from "@/entities/points";
import {
  addTaskToFirebase,
  deleteTaskFromFirebase,
  syncTasksToFirebase,
  syncTaskToFirebase,
} from "../api/firebaseApi";

type TaskStore = {
  tasks: TaskModel[];
  taskPoints: number;
  totalPoints: number;

  addTask: (task: TaskModel) => void;
  toggleTaskCompleted: (taskId: number) => void;
  deleteTask: (taskId: number) => void;
  updateTask: (newTask: TaskModel) => void;
  updateTasks: (newTasks: TaskModel[]) => void;
};

function getToken() {
  return localStorage.getItem("token") || "";
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => {
      return {
        tasks: [],
        taskPoints: 0,
        totalPoints: 0,
        projectId: null,
        /**
         * Adds a new task to the local store and schedules a sync with the server.
         */
        addTask: async (task) => {
          const setSync = useSyncStore.getState().setIsSyncingFromFirebase;
          setSync(true);

          set((state) => ({
            tasks: [
              ...state.tasks,
              { ...task, updatedAt: new Date().toISOString() },
            ],
          }));

          try {
            await addTaskToFirebase(task);
          } catch (error) {
            console.error("Firebase error:", error);
          } finally {
            setSync(false);
          }
        },
        /**
         * Toggles the completion status of a task and schedules a sync.
         */
        toggleTaskCompleted: async (taskId) => {
          const taskToUpdate: Partial<TaskModel> =
            get().tasks.find((t) => t.taskId === taskId) || {};
          const newCompletionStatus = !taskToUpdate.isCompleted;
          const setTotalPoints = usePointsStore.getState().setTotalPoints;
          const totalPoints = usePointsStore.getState().totalPoints;

          if (newCompletionStatus) {
            setTotalPoints(totalPoints + (taskToUpdate.taskPoints || 0));
          } else {
            setTotalPoints(totalPoints - (taskToUpdate.taskPoints || 0));
          }

          const setSync = useSyncStore.getState().setIsSyncingFromFirebase;
          setSync(true);

          set((state) => {
            return {
              tasks: state.tasks.map((t) =>
                t.taskId === taskId
                  ? {
                      ...t,
                      updatedAt: new Date().toISOString(),
                      isCompleted: newCompletionStatus,
                    }
                  : t
              ),
            }; // Optimistic update, clear pendingSync for this op initially
          });

          const updatedTask = get().tasks.find((t) => t.taskId === taskId);
          if (!updatedTask) {
            setSync(false);
            return;
          }

          try {
            await syncTaskToFirebase(updatedTask);
            console.log("Task updated in Firebase", updatedTask);
          } catch (error) {
            console.error("Ошибка при синхронизации задачи в Firebase:", error);
          } finally {
            setSync(false);
          }
        },
        deleteTask: async (taskId) => {
          const setSync = useSyncStore.getState().setIsSyncingFromFirebase;
          setSync(true);

          set((state) => ({
            tasks: state.tasks.filter((t: TaskModel) => t.taskId !== taskId),
          }));

          try {
            await deleteTaskFromFirebase(taskId);
          } catch (error) {
            console.error("Ошибка при удалении задачи в Firebase:", error);
          } finally {
            setSync(false);
          }
        },
        updateTask: async (taskDataToUpdate) => {
          // taskDataToUpdate contains taskId and fields to change
          const setSync = useSyncStore.getState().setIsSyncingFromFirebase;

          const updatedTask = get().tasks.find(
            (t) => t.taskId === taskDataToUpdate.taskId
          );
          const updatedTaskData = {
            ...updatedTask,
            ...taskDataToUpdate,
            updatedAt: new Date().toISOString(),
          };
          if (!updatedTask) {
            setSync(false);
            return;
          }
          setSync(true);

          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.taskId === taskDataToUpdate.taskId
                ? {
                    ...t,
                    ...updatedTaskData,
                  }
                : t
            ),
          }));

          try {
            await syncTaskToFirebase(updatedTaskData);
            console.log("Task updated in Firebase", updatedTaskData);
          } catch (error) {
            console.error("Ошибка при синхронизации задачи в Firebase:", error);
          } finally {
            setSync(false);
          }
        },
        /**
         * Updates the entire task list (e.g., after a drag-and-drop reorder) and schedules a sync.
         * Ensures that all tasks in the new list get a fresh `updatedAt` timestamp.
         */
        updateTasks: async (newTasks: TaskModel[]) => {
          const setSync = useSyncStore.getState().setIsSyncingFromFirebase;
          setSync(true);
          set({
            tasks: newTasks.map((task) => ({
              ...task,
              updatedAt: new Date().toISOString(),
            })),
          });

          try {
            await syncTasksToFirebase(newTasks);
          } catch (error) {
            console.error("Ошибка при синхронизации задач в Firebase:", error);
          } finally {
            setSync(false);
          }
        },
      };
    },
    {
      name: "tasks",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
