import { TaskModel, TaskComponent } from "@/entities/task";
import { useTaskStore } from "@/entities/task/model/store";
import { TaskInput } from "@/features/addTask";


type TaskListProps = {
    title: string,
    tasks: TaskModel[]
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
                // (props.tasks.length > 0) 
                (tasks.length > 0)
                    ? (
                        // props.tasks.map((task)=>(
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