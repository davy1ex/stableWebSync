import { Board } from "@/widgets/Board"
import { useTaskStore } from "@/entities/task"
import { useEffect } from "react"

export const MainPage = () => {    
    // const connectSync = useTaskStore(state => state.connectSync)
    // const disconnectSync = useTaskStore(state => state.disconnectSync)

    // useEffect(() => {
    //     // Initialize sync when component mounts
    //     connectSync()
        
    //     // Cleanup sync when component unmounts
    //     return () => {
    //         disconnectSync()
    //     }
    // }, [connectSync, disconnectSync])

    return (
        <Board />
    )
}