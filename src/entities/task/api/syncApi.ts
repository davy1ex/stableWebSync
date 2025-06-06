import { useQuery } from "react-query";
import { useTaskStore } from "../model/store";
import { fetchTasks } from "./firebaseApi";
import { useEffect } from "react";
import { TaskModel } from "../model/TaskModel";

export function fetchAndUpdateTasks() {
  const { data: tasks } = useQuery("tasks", fetchTasks);
  const setTasks = useTaskStore((state) => state.updateTasks);

  useEffect(() => {
    if (tasks) {
      setTasks(tasks as TaskModel[]);
    }
  }, [tasks, setTasks]);
  return 0;
}
