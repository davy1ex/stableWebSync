import { TaskModel } from "../../task/model/TaskModel"

export type ProjectModel = {
    projectId: number
    projectName: string
    projectDescription: string
    updatedAt: string
    tasks: TaskModel[]
    roughPlan: {
        todo: string
        isCompleted: boolean
    }[]
    projectPoints: number
    status: "notStarted" | "active" | "waiting" |"completed"
    order: number
}