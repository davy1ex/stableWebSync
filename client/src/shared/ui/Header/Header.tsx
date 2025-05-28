import { useNavigate } from "react-router-dom";
import { SyncStatusDisplay } from "@/features/syncStatus";

type HeaderProps = {
    username: string | null,
    logout: () => void,
}

export const Header = ({username, logout}: HeaderProps) => {
    const navigate = useNavigate();
    if (!username) return null;
    
    return (
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: '#f5f5f5'}}>
            <span>Welcome, {username}</span>
            <SyncStatusDisplay />
            <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </header>
    );
};