import React from 'react';
import { useTaskStore } from '@/entities/task';
import './SyncStatusDisplay.css';
import { useSyncStore } from '@/features/sync';

export const SyncStatusDisplay: React.FC = () => {
    const isSyncingFromFirebase = useSyncStore((state) => state.isSyncingFromFirebase);

    let statusText = 'Synced';
    let statusClass = ".synced;"

    if (isSyncingFromFirebase) {
        statusText = 'Saving... 🔃';
        statusClass = ".saving";
    } else {
        statusText = 'Synced ✅';
        statusClass = ".synced;"
    }

    return (
        <div className={`syncStatus ${statusClass}`}>
            {statusText}
        </div>
    );
}; 