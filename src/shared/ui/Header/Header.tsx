import { useNavigate } from "react-router-dom";
import { SyncStatusDisplay } from "@/features/syncStatus";
import { useSettingsStore } from "@/entities/settings";
import { handleFileUpload } from "@/shared/lib/download";
import "./Header.css"

type HeaderProps = {
    username: string | null,
    logout: () => void,
    toggleTheme: () => void,
    totalPoints: number
}

export const Header = ({username, logout, toggleTheme, totalPoints}: HeaderProps) => {
    const navigate = useNavigate();
    const withoutServerSync = useSettingsStore((state) => state.getWithoutServerSync());
    const setWithoutServerSync = useSettingsStore((state) => state.setWithoutServerSync);

    const handleClickServerSync = () => {
        if (withoutServerSync) {
            setWithoutServerSync(false)
        } else {
            setWithoutServerSync(true)
        }
    }
    
    if (!username && !withoutServerSync) {
        return (
            <header>
                <span>Welcome, offline user</span>
                <button onClick={handleClickServerSync}>
                    {withoutServerSync ? "Enable server sync" : "Try offline mode"}
                </button>
            </header>
        )
    }
    
    return (    
        <header>
            <div className="headerItem">Coins: {totalPoints}</div>

            <div className="headerItem headerItemVertical active">
                Home
            </div>

            <div className="headerItem headerItemVertical">
                Goals
            </div>

            <div className="headerItem headerItemVertical">
                Freewrite
            </div>

            <div className="headerItem headerItemVertical">
                Character
            </div>

            <div className="headerItem headerItemVertical">
                Settings
            </div>
{/* 
            <button className="headerItem" onClick={() => { withoutServerSync ? setWithoutServerSync(false) : setWithoutServerSync(true) }}>
                {withoutServerSync ? "Enable server sync" : "Disable server sync"}
            </button>
            
             */}
            
            {/* <button className="headerItem" onClick={() => { logout(); navigate('/login'); }}>Logout</button> */}
        </header>
    );
};