import { getFirestore, Firestore } from "firebase/firestore";
import { app } from "./firebaseConfig";

export const db: Firestore  = getFirestore(app);
