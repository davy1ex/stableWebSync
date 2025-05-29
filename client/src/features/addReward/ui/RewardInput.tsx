import { useState } from "react"
import { useRewardStore } from "@/entities/reward/model/store"
import './RewardInput.css'

export const RewardInput = () => {
    const addReward = useRewardStore(state => state.addReward)
    const rewards = useRewardStore(state => state.rewards)
    const [rewardName, setRewardName] = useState('')
    const [rewardPoints, setRewardPoints] = useState(0)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        addReward({ 
            rewardId: Date.now(),
            rewardName: rewardName, 
            rewardPoints: rewardPoints,
            order: rewards.length + 1,
            updatedAt: new Date().toISOString()
         })
         
    }

    return (
        <div className="rewardInput">
            <form onSubmit={handleSubmit}>
                <div className="rewardInputContainer">
                    <input type="text" className="rewardInputName" placeholder="Reward Name" value={rewardName} onChange={(e) => setRewardName(e.target.value)} />
                    <input type="number" className="rewardInputPoints" placeholder="Points" value={rewardPoints} onChange={(e) => setRewardPoints(parseInt(e.target.value))} />
                </div>
                <button type="submit">Add Reward</button>
            </form>
        </div>
    )
}