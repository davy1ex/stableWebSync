import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "@/shared/lib/firebase";
import { TaskModel } from "@/entities/task";

const tasksCollectionRef = collection(db, "tasks");

export const fetchTasks = async () => {
  const tasksSnapshot = await getDocs(tasksCollectionRef);
  const tasksList = tasksSnapshot.docs.map((doc) => {
    const data = doc.data();
    if (data.id) {
      return data;
    } else {
      return null;
    }
  });
  return tasksList;
};

export const addTaskToFirebase = async (task: TaskModel) => {
  const tasksRef = doc(db, "tasks", String(task.taskId));
  await setDoc(tasksRef, task, { merge: true });
};

export const subscribeToTasks = (
  onUpdate: (tasks: TaskModel[]) => void,
  onRemove: (taskId: number) => void
) => {
  const tasksCollectionRef = collection(db, "tasks");

  return onSnapshot(tasksCollectionRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data() as TaskModel & { taskId: number };
      switch (change.type) {
        case "added":
        case "modified":
          onUpdate([data] as TaskModel[]);
          break;
        case "removed":
          onRemove(data.taskId);
          break;
      }
    });
  });
};
