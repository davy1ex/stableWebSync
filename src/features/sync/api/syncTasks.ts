import { TaskModel } from "@/entities/task";
import {
  fetchTasks,
  syncTasksToFirebase,
} from "@/entities/task/api/firebaseApi";
import { useSyncStore } from "../model/store";

export const syncFromFirebase = async (
  updateTasks: (tasks: TaskModel[]) => void
) => {
  const tasks = await fetchTasks();
  if (tasks.length > 0) {
    return tasks as TaskModel[];
  } else {
    return [];
  }
};

export const syncToFirebase = async (tasks: TaskModel[]) => {
  if (useSyncStore.getState().isSyncingFromFirebase) {
    return;
  }

  try {
    useSyncStore.getState().setIsSyncingFromFirebase(true);
    await syncTasksToFirebase(tasks);
  } catch (e) {
    console.error("Ошибка синхронизации с Firebase:", e);
  } finally {
    useSyncStore.getState().setIsSyncingFromFirebase(false);
  }
};
