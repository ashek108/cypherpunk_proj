import { LuHeart } from "react-icons/lu"
import RequiresAuth from "../auth/RequiresAuth"
import React, { useOptimistic, useTransition } from "react"
import { likePost, unlikePost } from "@/lib/actions/unlikePost"

interface LikeCountProps{
    likeCount:number
    likedByUser?:boolean
    postId:string,
}

export default function LikeCount({postId, likeCount,likedByUser}:LikeCountProps) {
  const [pending,startTransition] = useTransition()

  const [optimisticLikeCount ,setoptimisticLikeCount] = useOptimistic(likeCount)
  const [optimisticLikedByUser ,setoptimisticLikedByUser] = useOptimistic(likedByUser)
 
  function likeOrDislikePost(e:React.MouseEvent){
    e.preventDefault()
    e.stopPropagation()
    startTransition(async ()=>{
      if(optimisticLikedByUser){
        setoptimisticLikedByUser(false)
        setoptimisticLikeCount(optimisticLikeCount-1)
        await unlikePost(postId)
      }else{
        setoptimisticLikedByUser(true)
        setoptimisticLikeCount(optimisticLikeCount+1)
        await likePost(postId)
      }
    })


  }
  return (
    <div className="flex">
        <RequiresAuth className="flex items-center " onClick={likeOrDislikePost}>
            <LuHeart className={`mr-1 h-5 w-5 ${optimisticLikedByUser?'fill-red-500 text-red-500':'hover:fill-red-300'} `}/>
        </RequiresAuth>
        <span>{optimisticLikeCount}</span>
    </div>
  )
}
