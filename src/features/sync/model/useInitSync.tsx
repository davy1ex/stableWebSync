import { useEffect, useRef, useState } from "react";
import { useTaskStore } from "@/entities/task";
import { syncFromFirebase } from "../api/syncTasks";
import { startSyncListener } from "./syncListener";
import { subscribeToTasks } from "@/entities/task/api/firebaseApi";
import { ModalSyncOnFirstStart } from "../ui/ModalSyncOnFirstStart";

const HAS_SYNCED_KEY = "hasSyncedThisSession";

export const useInitSync = (user: any, username: string | null) => {
  const updateTasks = useTaskStore((state) => state.updateTasks);
  // const updateTaskInStoreIfNewer = useTaskStore((state) => state.updateTaskInStoreIfNewer);
  // const removeTaskFromStore = useTaskStore((state) => state.removeTaskFromStore);
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
  
    // const unsubscribe = subscribeToTasks(
    //   (task) => {
    //     // Сравнивать task.updatedAt с локальным — если новее, обновить локальный стор
    //     updateTaskInStoreIfNewer(task[0]);
    //   },
    //   (taskId) => {
    //     removeTaskFromStore(taskId);
    //   }
    // );
  
    // return () => unsubscribe();
  }, [user]);

  const handleSync = async () => {
    await syncFromFirebase(updateTasks);
    localStorage.setItem(HAS_SYNCED_KEY, "true");
  };
  

  return (
    <ModalSyncOnFirstStart
      username={username}
      onSync={handleSync}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
    />
    // <ModalWindow isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
    //   <div>
    //     <h1>Hi {username}</h1>
    //     <p>You have some tasks in local storage. Do you want to sync them with the server?</p>
    //     <button
    //       onClick={() => {
    //         syncFromFirebase(updateTasks);
    //         setIsModalOpen(false);
    //         localStorage.setItem(HAS_SYNCED_KEY, "true");
    //       }}
    //     >
    //       Sync
    //     </button>
    //     <button onClick={() => setIsModalOpen(false)}>Cancel</button>
    //   </div>
    // </ModalWindow>
  );
};
