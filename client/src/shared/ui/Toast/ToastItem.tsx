import React, { useEffect, useState } from "react";
import { Toast } from "@/features/showToast";
import "./Toast.css";

type ToastItemProps = {
    toast: Toast
    onClick: () => void
}

export const ToastItem = ({ toast, onClick}: ToastItemProps) => {
    const [progress, setProgress] = useState(100);
    const handleToastClick = () => {
        if (toast.type !== "info") {
            onClick()
        }
    }

    const handleUndoClick = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        e.preventDefault();
        toast.undoAction?.()
    }

    useEffect(() => {
        const timeExpired = toast.timeExpired || 5000;
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, timeExpired - elapsed);
            const progressPercent = (remaining / timeExpired) * 100;

            setProgress(progressPercent);

            if (remaining <= 0) clearInterval(interval);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`toast-item toast-${toast.type}`} onClick={handleToastClick}>
            <div className="toast-message">
                {toast.message} 
                {toast.image && <img src={toast.image} alt="toast-image" />}
                { toast.undoAction && (
                    <button onClick={(e) => handleUndoClick(e)} onMouseDown={(e) => e.stopPropagation()}>Undo</button>
                )}
            </div>
            <div className="toast-progress" style={{ width: `${progress}%` }} />
        </div>
    );
};

