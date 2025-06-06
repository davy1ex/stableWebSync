import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { TaskModel } from "./TaskModel";

import { usePointsStore } from "@/entities/Points";

type TaskStore = {
  tasks: TaskModel[];
  taskPoints: number;
  totalPoints: number;

  addTask: (task: TaskModel) => void;
  toggleTaskCompleted: (taskId: number) => void;
  deleteTask: (taskId: number) => void;
  updateTask: (newTask: TaskModel) => void;
  updateTasks: (newTasks: TaskModel[]) => void;
  updateTaskInStoreIfNewer: (task: TaskModel) => void;
  removeTaskFromStore: (taskId: number) => void;
};

function getToken() {
  return localStorage.getItem("token") || "";
}

export let isSyncingFromFirebase = false;

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
        addTask: (task) => {
          isSyncingFromFirebase = true;
          set((state) => ({
            tasks: [
              ...state.tasks,
              { ...task, updatedAt: new Date().toISOString() },
            ],
          }));
          isSyncingFromFirebase = false;
        },
        /**
         * Toggles the completion status of a task and schedules a sync.
         */
        toggleTaskCompleted: (taskId) => {
          let taskToUpdate: Partial<TaskModel> =
            get().tasks.find((t) => t.taskId === taskId) || {};
          const newCompletionStatus = !taskToUpdate.isCompleted;
          const setTotalPoints = usePointsStore.getState().setTotalPoints;
          const totalPoints = usePointsStore.getState().totalPoints;

          if (newCompletionStatus) {
            setTotalPoints(totalPoints + (taskToUpdate.taskPoints || 0));
          } else {
            setTotalPoints(totalPoints - (taskToUpdate.taskPoints || 0));
          }
          isSyncingFromFirebase = true;
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
          isSyncingFromFirebase = false;
        },
        deleteTask: (taskId) => {
          isSyncingFromFirebase = true;
          set((state) => ({
            tasks: state.tasks.filter((t: TaskModel) => t.taskId !== taskId),
          }));
          isSyncingFromFirebase = false;
        },
        updateTask: (taskDataToUpdate) => {
          // taskDataToUpdate contains taskId and fields to change
          isSyncingFromFirebase = true;
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.taskId === taskDataToUpdate.taskId
                ? {
                    ...t,
                    ...taskDataToUpdate,
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
          }));
          isSyncingFromFirebase = false;
        },
        /**
         * Updates the entire task list (e.g., after a drag-and-drop reorder) and schedules a sync.
         * Ensures that all tasks in the new list get a fresh `updatedAt` timestamp.
         */
        updateTasks: (newTasks: TaskModel[]) => {
          isSyncingFromFirebase = true;
          set({
            tasks: newTasks.map((task) => ({
              ...task,
              updatedAt: new Date().toISOString(),
            })),
          });
          isSyncingFromFirebase = false;
        },
        updateTaskInStoreIfNewer: (task) => {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.taskId === task.taskId ? task : t
            ),
          }));
        },
        removeTaskFromStore: (taskId) => {
          isSyncingFromFirebase = true;
          set((state) => ({
            tasks: state.tasks.filter((t) => t.taskId !== taskId),
          }));
          isSyncingFromFirebase = false;
        },
      };
    },
    {
      name: "tasks",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
