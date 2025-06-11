import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RewardModel } from "../model/RewardModel"
import { useRewardStore } from "../model/store"
import { usePointsStore } from '@/entities/points'
import './RewardComponent.css'
import { useToastStore } from '@/features/showToast'

export const RewardComponent = ({ reward }: { reward: RewardModel } ) => {
    const deleteReward = useRewardStore(state => state.deleteReward)
    const updateReward = useRewardStore(state => state.updateReward)
    const [isNameEditing, setIsNameEditing] = useState(false)
    const [isPointsEditing, setIsPointsEditing] = useState(false)
    const [rewardName, setRewardName] = useState(reward.rewardName)
    const [rewardPoints, setRewardPoints] = useState(reward.rewardPoints)
    const nameEditRef = useRef<HTMLDivElement>(null)
    const pointsEditRef = useRef<HTMLDivElement>(null)
    const claimReward = useRewardStore(state => state.claimReward)
    const totalPoints = usePointsStore(state => state.totalPoints)
    const addToast = useToastStore(state => state.addToast)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({
        id: reward.rewardId.toString(),
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsNameEditing(false)
        setIsPointsEditing(false)
        updateReward({...reward, rewardName: rewardName, rewardPoints: rewardPoints})
    }

    useEffect(() => {
        if (totalPoints >= reward.rewardPoints) {
            addToast({
                message: `🎉 You can claim "${reward.rewardName}"`,
                type: "success",
                image: "https://media1.giphy.com/media/BK1EfIsdkKZMY/giphy.gif?cid=6c09b9529xrqzwej36k1d0j3zage94pl77izs0y17bvlm6ad&ep=v1_gifs_search&rid=giphy.gif&ct=g",
                timeExpired: 10000
            });
        }
    }, [totalPoints, reward.rewardPoints, reward.rewardName, addToast]);

    useEffect(() => {
        // function handleClickOutside(event: MouseEvent) { // TODO: delete it or refactor
        //     if (
        //         isNameEditing && 
        //         nameEditRef.current && 
        //         !nameEditRef.current.contains(event.target as Node)
        //     ) {
        //         setIsNameEditing(false)
        //         setRewardName(reward.rewardName) 
        //     }
        //   if (
        //     isPointsEditing && 
        //     pointsEditRef.current && 
        //     !pointsEditRef.current.contains(event.target as Node)
        // ) {
        //     setIsPointsEditing(false)
        //     setRewardPoints(reward.rewardPoints)
        // }
        // }
    
        function handleEscKey(event: KeyboardEvent) {
          if (event.key === 'Escape' && isNameEditing) {
            setIsNameEditing(false)
            setRewardName(reward.rewardName)
          }

          if (event.key === 'Escape' && isPointsEditing) {
            setIsPointsEditing(false)
            setRewardPoints(reward.rewardPoints)
          }
        }
    
        // document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleEscKey)
    
        return () => {
        //   document.removeEventListener("mousedown", handleClickOutside)
          document.removeEventListener("keydown", handleEscKey)
        }
      }, [isNameEditing, isPointsEditing, reward.rewardName, reward.rewardPoints])


    return (
        <div ref={setNodeRef} style={style} 
            className={`rewardContainer ${totalPoints >= reward.rewardPoints ? "canClaimReward" : ""}`}
        >
            {/* Drag handle area */}
            <div className="dragHandle" {...attributes} {...listeners}>
                ⋮⋮
            </div>
            {!isNameEditing && (
                <div className="rewardNameContainer">
                    <div className="rewardName" onClick={() => {setIsNameEditing(true)}}>
                        {reward.rewardName}
                    </div>
                    {!isPointsEditing && (
                        <div className="rewardPoints" onClick={() => {setIsPointsEditing(true)}}>
                            🪙 {reward.rewardPoints}
                        </div>
                    )}
                    
                </div>
                
            )}
            {isNameEditing && (
                <div className="rewardEdit" ref={nameEditRef}>
                    <form onSubmit={handleSubmit}>
                        <input type="text" value={rewardName} onChange={(e) => {
                            setRewardName(e.target.value)
                        }} />
                    </form>
                </div>
            )}
            {isPointsEditing && (
                <div className="rewardEdit" ref={pointsEditRef}>
                    <form onSubmit={handleSubmit}>
                        <input 
                            type="number" 
                            value={rewardPoints} 
                            onChange={(e) => {setRewardPoints(Number(e.target.value))}}
                        />
                    </form>
                </div>
            )}
            <div className="deleteButton" onClick={() => {
                deleteReward(reward.rewardId)
            }}>
                🗑️
            </div>
            
            {totalPoints >= reward.rewardPoints && (
                <>
                    <div className={`claimReward ${totalPoints >= reward.rewardPoints ? "canClaimReward" : ""}`} onClick={() => {
                        claimReward(reward.rewardId)
                    }}>
                        Claim
                    </div>
                </>
                
            )}
        </div>
    )
}