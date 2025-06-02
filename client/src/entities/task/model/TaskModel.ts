export type TaskModel = {
    taskId: number,
    taskName: string,
    isCompleted: boolean,
    projectId: number | null,
    // dateBox: "today" | "week" | "later",
    columnId: string,
    order: number,
    updatedAt?: string,
    taskPoints: number
}