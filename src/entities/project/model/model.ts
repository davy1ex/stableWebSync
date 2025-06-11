export type ProjectModel = {
    projectId: number
    projectName: string
    projectDescription: string
    updatedAt: string
    tasks: number[]
    roughPlan: {
        todo: string
        isCompleted: boolean
    }[]
    projectPoints: number
    status: "notStarted" | "active" | "waiting" |"completed"
    order: number
}