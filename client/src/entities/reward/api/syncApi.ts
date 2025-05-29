import { api } from "@/shared/api";
import { RewardModel } from "../model/RewardModel"

const API_URL = `${process.env.API_URL}`;

export class SyncError extends Error {
    constructor(public code: number, message: string) {
        super(message);
        this.name = 'SyncError';
    }
}

export async function syncRewards(rewards: RewardModel[], token: string): Promise<RewardModel[]> {
    const response = await fetch(`${API_URL}/rewards`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(rewards)
    })
    if (!response.ok) {
        throw new Error('Failed to sync rewards')
    }
    return response.json()
}

export async function addReward(reward: RewardModel, token: string): Promise<RewardModel> {
    const response = await fetch(`${API_URL}/rewards`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reward })
    })
    if (!response.ok) {
        throw new Error('Failed to add reward')
    }
    return response.json()
}

export async function deleteReward(rewardId: number, token: string): Promise<RewardModel> {
    try {
        const response = await api.delete(`${API_URL}/rewards/${rewardId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        return response.data
    }
    catch (error) {
        if (error instanceof SyncError) throw error;
        throw new SyncError(0, `Task delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function fetchRewards(token: string): Promise<RewardModel[]> {
    try {
        const response = await fetch(`${API_URL}/rewards`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) {
            if (response.status === 403) {
                throw new SyncError(403, 'Authentication failed - please log in again')
            }
            throw new SyncError(response.status, `Server error: ${response.statusText}`)
        }
        const data = await response.json()
        return data.rewards
    }
    catch (error) {
        if (error instanceof SyncError) throw error;
        // Ensure a SyncError is thrown for unified error handling upstream.
        throw new SyncError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function updateRewards(newRewards: RewardModel[], token: string): Promise<RewardModel[]> {
    const response = await api.patch(`${API_URL}/rewards`, {rewards: newRewards}, {
        headers: { 'Authorization': `Bearer ${token}` }
    })

    if (response.status !== 200) {
        throw new Error('Failed to update rewards')
    }
    return response.data
}

export async function updateReward(reward: RewardModel, token: string): Promise<RewardModel> {
    const response = await api.patch(`${API_URL}/rewards/${reward.rewardId}`, {reward}, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.data
}