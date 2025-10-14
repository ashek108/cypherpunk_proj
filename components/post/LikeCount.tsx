import { LuHeart } from "react-icons/lu"
import RequiresAuth from "../auth/RequiresAuth"

interface LikeCountProps{
    likeCount:number
    likedByUser?:boolean

}

export default function LikeCount({likeCount,likedByUser}:LikeCountProps) {
  return (
    <div className="flex">
        <RequiresAuth>
            <LuHeart className={`mr-1 h-5 w-5`}/>
        </RequiresAuth>
        <span>{likeCount}</span>
    </div>
  )
}
