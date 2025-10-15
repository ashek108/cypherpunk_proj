import { LuHeart } from "react-icons/lu"
import RequiresAuth from "../auth/RequiresAuth"

interface LikeCountProps{
    likeCount:number
    likedByUser?:boolean
    postId:string,
}

export default function LikeCount({postId, likeCount,likedByUser}:LikeCountProps) {
  return (
    <div className="flex">
        <RequiresAuth>
            <LuHeart className={`mr-1 h-5 w-5 ${likedByUser?'fill-red-500 text-red-500':'hover:fill-red-300'} `}/>
        </RequiresAuth>
        <span>{likeCount}</span>
    </div>
  )
}
