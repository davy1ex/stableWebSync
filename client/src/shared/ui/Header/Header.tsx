import { useNavigate } from "react-router-dom";
import { SyncStatusDisplay } from "@/features/syncStatus";
import { useSettingsStore } from "@/entities/settings";
import { handleFileUpload } from "@/shared/lib/download";
type HeaderProps = {
    username: string | null,
    logout: () => void,
    totalPoints: number
}

export const Header = ({username, logout, totalPoints}: HeaderProps) => {
    const navigate = useNavigate();
    const withoutServerSync = useSettingsStore((state) => state.getWithoutServerSync());
    const setWithoutServerSync = useSettingsStore((state) => state.setWithoutServerSync);
    
    if (!username && !withoutServerSync) {
        return (
            <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: '#f5f5f5'}}>
                <span>Welcome, offline user</span>
                <button onClick={() => { withoutServerSync ? setWithoutServerSync(false) : setWithoutServerSync(true) }}>
                    {withoutServerSync ? "Enable server sync" : "Try offline mode"}
                </button>
            </header>
        )
    }
    
    return (    
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: '#f5f5f5'}}>
            <button onClick={() => { withoutServerSync ? setWithoutServerSync(false) : setWithoutServerSync(true) }}>
                {withoutServerSync ? "Enable server sync" : "Disable server sync"}
            </button>
            
            {withoutServerSync ? (
                <>
                    <span>
                        Welcome, offline user {/*//todo separate offline logic to another component*/}
                    </span> 
                    <input type="file" accept=".json" onChange={(e) => { handleFileUpload(e) }}  />
                </>

            ) : (
                <>
                    <span>Welcome, {username}</span>
                    <SyncStatusDisplay />
                </>
            )}

            <div>Total points: {totalPoints}</div>
            <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </header>
    );
};