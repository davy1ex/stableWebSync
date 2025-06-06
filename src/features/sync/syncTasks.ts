import { TaskModel } from "@/entities/task";
import { addTaskToFirebase, fetchTasks } from "@/entities/task/api/firebaseApi";

export const syncFromFirebase = async (
  updateTasks: (tasks: TaskModel[]) => void
) => {
  const tasks = await fetchTasks();
  if (tasks.length > 0) {
    return tasks as TaskModel[];
  } else {
    return [];
  }
};

export const syncToFirebase = async (tasks: TaskModel[]) => {
  for (const task of tasks) {
    await addTaskToFirebase(task);
  }
};
