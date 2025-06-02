import { get } from "http";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Toast = {
    id: string;
    message: string;
    type?: "success" | "error" | "info";
    timeExpired?: number;
    undoAction?: () => void;
};

type ToastStore = {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
};

export const useToastStore = create<ToastStore>()(persist(
    ((set, get) => ({
        toasts: [],
        addToast: (toast) => {
            const id = Date.now().toString();
            if (get().toasts.find((t) => t.message === toast.message) && toast.type == "info") {
                return
            }
            set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
            setTimeout(() => {
                set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
            }, toast.timeExpired || 5000);
        },
        removeToast: (id) =>
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    })),
    {
        name: "toasts",
        storage: createJSONStorage(() => localStorage),
    }
))
