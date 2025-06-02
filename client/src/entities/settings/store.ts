import {create} from "zustand"
import {createJSONStorage, persist} from "zustand/middleware"


interface SettingsStore {
    withoutServerSync: boolean;
    setWithoutServerSync: (withoutServerSync: boolean) => void;
    getWithoutServerSync: () => boolean;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            withoutServerSync: true,

            setWithoutServerSync: (withoutServerSync: boolean) => set({ withoutServerSync }),
            getWithoutServerSync: () => get().withoutServerSync,
        }),
        {
            name: "settings",
            storage: createJSONStorage(() => localStorage)
        }
    )
);
