export type TaskModel = {
    taskId: number,
    taskName: string,
    isCompleted: boolean,
    // dateBox: "today" | "week" | "later",
    columnId: string,
    order: number
}