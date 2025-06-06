import React from 'react';
import { useTaskStore } from '@/entities/task';
import './SyncStatusDisplay.css';

export const SyncStatusDisplay: React.FC = () => {
    // const isOnline = useTaskStore((state) => state.isOnline);
    // const pendingSync = useTaskStore((state) => state.pendingSync);

    // let statusText = 'Synced';
    // let statusClass = ".synced;"

    // if (!isOnline) {
    //     statusText = '⚠️ Offline';
    //     statusClass = ".offline;"
    // } else if (pendingSync) {
    //     statusText = 'Saving...';
    //     statusClass = ".saving";
    // }

    return (
        <></>
    )
    //     <div className={`.syncStatus ${statusClass}`}>
    //         {statusText}
    //     </div>
    // );
}; 