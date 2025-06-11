import { TaskModel } from "@/entities/task";
import { ModalWindow } from "@/shared/ui/ModalWindow";

type ModalSyncOnFirstStartProps = {
    isModalOpen: boolean,
    setIsModalOpen: (state: boolean) => void,
    username: string | null,
    onSync: () => Promise<void>,
    onCancel?: () => void
}

export const ModalSyncOnFirstStart = ({
    isModalOpen,
    setIsModalOpen,
    username,
    onSync,
    onCancel = () => setIsModalOpen(false),
}: ModalSyncOnFirstStartProps) => {
    return (
    <ModalWindow isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <div>
        <h1>Hi {username}</h1>
        <p>You have some tasks in local storage. Do you want to sync them with the server?</p>
        <button
          onClick={async () => {
            await onSync()//syncFromFirebase(updateTasks);
            setIsModalOpen(false);
            // localStorage.setItem(HAS_SYNCED_KEY, "true"); // todo need make flag for synced or no on first start if data in localstorage exist
          }}
        >
          Sync
        </button>
        <button onClick={() => setIsModalOpen(false)}>Cancel</button>
      </div>
    </ModalWindow>
  );
}