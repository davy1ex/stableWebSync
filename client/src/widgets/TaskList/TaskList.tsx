import { TaskModel, TaskComponent } from "@/entities/task";
import { useTaskStore } from "@/entities/task";
import { TaskInput } from "@/features/addTask";

type TaskListProps = {
    title: string,
}

export const TaskList = (props: TaskListProps) => {
    const tasks = useTaskStore((state)=>state.tasks)

    return (
        <div className={"taskListContainer"}>
            <div className="taskListTitle">
                {props.title}
            </div>

            <TaskInput />

            <div className="taskList">
            {
                (tasks.length > 0)
                    ? (
                        tasks.map((task)=>(
                            <TaskComponent task={task}/>
                        ))
                    )
                    : "no tasks"
            }
            </div>
        </div>
    )
}