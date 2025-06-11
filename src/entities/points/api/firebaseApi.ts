import { doc, getDocs, updateDoc } from "firebase/firestore";
import { collection } from "firebase/firestore";
import { PointsModel } from "@/entities/points/store";
import { db } from "@/shared/lib/firebase";

const pointsCollectionRef = collection(db, "points");

export const fetchPoints = async () => {
  const pointsSnapshot = await getDocs(pointsCollectionRef);
  const pointsList = pointsSnapshot.docs.map((doc) => {
    const data = doc.data() as PointsModel;
    return {
      ...data,
      id: doc.id,
    };
  });
  return pointsList;
};

export const updatePoints = async (id: string, points: number) => {
  const pointDoc = doc(db, "points", id);
  await updateDoc(pointDoc, { points });
};
