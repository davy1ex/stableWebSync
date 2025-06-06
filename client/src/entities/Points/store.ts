import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type PointsModel = {
  id: string;
  points: number;
};

type PointsStore = {
  totalPoints: number;
  setTotalPoints: (points: number) => void;
};

export const usePointsStore = create<PointsStore>()(
  persist(
    (set) => ({
      totalPoints: 0,
      setTotalPoints: (points: number) => set({ totalPoints: points }),
    }),
    {
      name: "points",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
