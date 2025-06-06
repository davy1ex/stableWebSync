import { useToastStore } from "@/features/showToast";
import { ToastItem } from "./ToastItem";
import "./Toast.css";

export const ToastContainer = () => {
    const toasts = useToastStore((state) => state.toasts);
    const hideToast = useToastStore((state) => state.removeToast)

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClick={() => hideToast(toast.id)}/>
            ))}
        </div>
    );
};
