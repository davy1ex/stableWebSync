import { TaskComponent } from "@/entities/task";
import { useTaskStore } from "@/entities/task";
import { TaskInput } from "@/features/addTask";
import { useMemo } from "react";

type TaskListProps = {
    title: string,
    columnId: string
}

export const TaskList = ({ title, columnId }: TaskListProps) => {
    const tasks = useTaskStore(state => state.tasks)
    const stored = tasks.sort((a, b) => a.order - b.order)
    
    return (
        <div className={"taskListContainer"}>
            <div className="taskListTitle">
                {title}
            </div>

            <TaskInput columnId={columnId} />

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