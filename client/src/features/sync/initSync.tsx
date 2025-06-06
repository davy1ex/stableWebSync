import { useEffect, useRef, useState } from "react";
import { useTaskStore } from "@/entities/task";
import { syncFromFirebase } from "./syncTasks";
import { startSyncListener } from "./syncListener";
import { ModalWindow } from "@/shared/ui/ModalWindow";
import { subscribeToTasks } from "@/entities/task/api/firebaseApi";

const HAS_SYNCED_KEY = "hasSyncedThisSession";

export const useInitSync = (user: any, username: string | null) => {
  const updateTasks = useTaskStore((state) => state.updateTasks);
  const updateTaskInStoreIfNewer = useTaskStore((state) => state.updateTaskInStoreIfNewer);
  const removeTaskFromStore = useTaskStore((state) => state.removeTaskFromStore);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasStartedSync = useRef(false);

  useEffect(() => {
    if (user && !hasStartedSync.current) {
      hasStartedSync.current = true;

      startSyncListener();

      const localTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
      const hasSynced = localStorage.getItem(HAS_SYNCED_KEY) === "true";

      if (localTasks.length > 0 && !hasSynced) {
        setIsModalOpen(true);
      } else {
        syncFromFirebase(updateTasks);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
  
    const unsubscribe = subscribeToTasks(
      (task) => {
        // Сравнивать task.updatedAt с локальным — если новее, обновить локальный стор
        updateTaskInStoreIfNewer(task[0]);
      },
      (taskId) => {
        // Удалить задачу из локального стора
        removeTaskFromStore(taskId);
      }
    );
  
    return () => unsubscribe();
  }, [user]);
  

  return (
    <ModalWindow isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <div>
        <h1>Hi {username}</h1>
        <p>You have some tasks in local storage. Do you want to sync them with the server?</p>
        <button
          onClick={() => {
            syncFromFirebase(updateTasks);
            setIsModalOpen(false);
            localStorage.setItem(HAS_SYNCED_KEY, "true");
          }}
        >
          Sync
        </button>
        <button onClick={() => setIsModalOpen(false)}>Cancel</button>
      </div>
    </ModalWindow>
  );
};
