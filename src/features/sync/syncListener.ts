import { useTaskStore } from "@/entities/task";
import { syncToFirebase } from "./syncTasks";
import { TaskModel } from "@/entities/task";
import isEqual from "lodash.isequal";

import { useSyncStore } from "./model/store";

let lastSyncedTasks: TaskModel[] = [];

export const startSyncListener = () => {
  const unsubscribe = useTaskStore.subscribe((state) => {
    const tasks = state.tasks;

    if (useSyncStore.getState().isSyncingFromFirebase) {
      return;
    }

    console.log("[sync] Syncing to Firebase...", tasks);

    if (!isEqual(tasks, lastSyncedTasks)) {
      lastSyncedTasks = tasks;
      syncToFirebase(tasks).catch(console.error);
    }
  });

  return unsubscribe;
};
