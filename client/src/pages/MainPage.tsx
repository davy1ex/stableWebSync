import { TaskModel } from "@/entities/task"
import { Board } from "../widgets/Board/Board"
import { AuthPage } from "./AuthPage"

export const MainPage = () => {
    const tasks: TaskModel[] = [
        {
            taskId: 1,
            taskName: "kek",
            isCompleted: false,
            dateBox: "today"
        },

        {
            taskId: 2,
            taskName: "kek2",
            isCompleted: false,
            dateBox: "today"
        },

        {
            taskId: 3,
            taskName: "kek3",
            isCompleted: false,
            dateBox: "today"
        }
    ]
    
    return (
        <>
        <Board />
        <AuthPage />
        </>
    )

}