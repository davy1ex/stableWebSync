import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SyncStore = {
  isSyncingFromFirebase: boolean;
  setIsSyncingFromFirebase: (value: boolean) => void;
};

export const useSyncStore = create<SyncStore>()(
  persist(
    (set) => ({
      isSyncingFromFirebase: false,
      setIsSyncingFromFirebase: (value) =>
        set({ isSyncingFromFirebase: value }),
    }),
    {
      name: "sync",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
