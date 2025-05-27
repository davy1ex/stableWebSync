import { LoginForm } from "@/features/auth/ui/LoginForm"

export const AuthPage = () => {
    return (<LoginForm onLogin={()=>{window.location.href = "/"}} />)
}