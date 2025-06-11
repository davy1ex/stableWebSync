import { useNavigate } from "react-router-dom";
import { SyncStatusDisplay } from "@/features/syncStatus";
import { useSettingsStore } from "@/entities/settings";
import { handleFileUpload } from "@/shared/lib/download";
import { NavItem } from "./NavItem";
import { NAV_ITEMS } from "@/shared/const/NavItems";
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
            <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8}}>
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

            {NAV_ITEMS.map(item => (
                <NavItem key={item.label} item={item.label} />
            ))}
           

            <button className="headerItem" onClick={() => { withoutServerSync ? setWithoutServerSync(false) : setWithoutServerSync(true) }}>
                {withoutServerSync ? "Enable server sync" : "Disable server sync"}
            </button>
            
            {withoutServerSync ? (
                <>
                    <div className="headerItem">
                        Welcome, offline user {/*//todo separate offline logic to another component*/}
                    </div> 
                    <input type="file" accept=".json" onChange={(e) => { handleFileUpload(e) }}  />
                </>

            ) : (
                <>
                    <div className="headerItem">Welcome, {username}</div>
                    <div className="headerItem"><SyncStatusDisplay /></div>
                </>
            )}
            <button className="headerItem" onClick={() => toggleTheme()}>change theme</button>
            
            <button className="headerItem" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </header>
    );
};