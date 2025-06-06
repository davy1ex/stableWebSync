import { useTaskStore } from "@/entities/task";
import { syncToFirebase } from "./syncTasks";
import { TaskModel } from "@/entities/task";
import isEqual from "lodash.isequal";

import { isSyncingFromFirebase } from "@/entities/task/model/store";

let lastSyncedTasks: TaskModel[] = [];

export const startSyncListener = () => {
  useTaskStore.subscribe((currentTasks) => {
    const tasks = currentTasks.tasks;

    if (isSyncingFromFirebase) {
      return;
    }

    console.log("[sync] Syncing to Firebase...", tasks);

    if (!isEqual(tasks, lastSyncedTasks)) {
      lastSyncedTasks = tasks;

      syncToFirebase(tasks).catch(console.error);
    }
  });
};
