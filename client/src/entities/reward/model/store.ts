import { create } from "zustand"
import { RewardModel } from "./RewardModel"
import { persist } from "zustand/middleware"
import { addReward, deleteReward, updateReward, updateRewards } from "../api/syncApi"
import { useSettingsStore } from "@/entities/settings/store";
type RewardStore = {
    rewards: RewardModel[],
    // isOnline: boolean,
    pendingSync: boolean,
    
    addReward: (reward: RewardModel) => void,
    deleteReward: (rewardId: number) => void,
    updateReward: (reward: RewardModel) => void,
    updateRewards: (newRewards: RewardModel[]) => void,
    
    // syncWithServer: () => Promise<void>,
    // getReward: (rewardId: number) => RewardModel | undefined
    // getRewards: () => RewardModel[]
    // getRewardByPoints: (points: number) => RewardModel | undefined
}

function getToken() {
    return localStorage.getItem('token') || ''
}

const withoutServerSync = useSettingsStore.getState().withoutServerSync;

export const useRewardStore = create<RewardStore>()(
    persist(
        (set, get) => ({
            rewards: [],
            pendingSync: false,
            addReward: (reward: RewardModel) => {
                set((state) => ({
                    rewards: [...state.rewards, reward],
                    pendingSync: true
                }))
                if (!withoutServerSync) {
                    addReward(reward, getToken()) // TODO make solution - how sync on change like in taskStore or like here?
                }
            },
            deleteReward: async (rewardId: number) => {
                set((state) => ({
                    rewards: state.rewards.filter(reward => reward.rewardId !== rewardId),
                    pendingSync: true
                }))
                if (!withoutServerSync) {
                    const deletedReward = await deleteReward(rewardId, getToken())
                    console.log("deletedReward", deletedReward)
                    set((state) => ({
                        rewards: state.rewards.filter(reward => reward.rewardId !== deletedReward.rewardId),
                        pendingSync: false
                    }))
                }
            },
            updateReward: (reward: RewardModel) => {
                console.log("updateReward", reward)
                set((state) => ({
                    rewards: state.rewards.map(r => r.rewardId === reward.rewardId ? reward : r),
                    pendingSync: true
                }))
                if (!withoutServerSync) {
                    updateReward(reward, getToken())
                }
            },
            updateRewards: (newRewards: RewardModel[]) => {
                console.log("getted rewards from server on sync:", newRewards)
                const rewardsWithTimestamps = newRewards.map(reward => ({
                    ...reward,
                    // Always assign a new timestamp on bulk updates to signify they are the latest local version.
                    updatedAt: new Date().toISOString()
                }));
                set({
                    rewards: rewardsWithTimestamps,
                    pendingSync: false // Mark for sync
                })
                if (!withoutServerSync) {
                    updateRewards(rewardsWithTimestamps, getToken())
                }
            },

        }),
        {
            name: "reward-store"
        }
    )
)