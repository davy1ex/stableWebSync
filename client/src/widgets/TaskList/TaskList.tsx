import { TaskComponent } from "@/entities/task";
import { useTaskStore } from "@/entities/task";
import { TaskInput } from "@/features/addTask";
import { useMemo } from "react";

type TaskListProps = {
    title: string,
    columnId: string,
    projectId: number | null
    showTitle?: boolean
    showAddTask?: boolean
}

export const TaskList = ({ title, columnId, projectId, showTitle=true, showAddTask=true }: TaskListProps) => {
    const tasks = useTaskStore(state => state.tasks)
    let stored = tasks.sort((a, b) => a.order - b.order)
    
    if (columnId) {
        stored = stored.filter(tasks => tasks.columnId == columnId)
    }
    if (projectId) {
        stored = stored.filter(task => task.projectId === projectId)
    }
    
    return (
        <div className={"taskListContainer"}>
            {showTitle && (
                <div className="taskListTitle">
                    {title}
                </div>
            )}

            {showAddTask && (
                <TaskInput columnId={columnId} projectId={projectId} />
            )}

            <div className="taskList">
            {
                (stored.length > 0)
                    ? (
                        stored.map((task) => (
                            <TaskComponent key={task.taskId} task={task}/>
                        ))
                    )
                    : "no tasks"
            }
            </div>
        </div>
    )
}