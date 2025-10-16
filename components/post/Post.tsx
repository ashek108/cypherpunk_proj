"use client"
import Link from "next/link"
import Avatar from "../ui/Avatar"
import ProfileLink from "../profile/ProfileLink"
import { useRouter } from "next/navigation"
import PostContent from "./PostContent"
import { LuMessageCircle } from "react-icons/lu"
import LikeCount from "./LikeCount"
import SharePost from "./SharePost"
import INVEST from "./INVEST"


interface PostProps{
    profileId:string,
    username:string,
    content:string,
    commentCount:number,
    likeCount:number,
    postId:string,
    parentId?:string|null,
    likedByUser?:boolean,
    hasLink?:boolean,
    linksToParent?:boolean
}


export default function Post(props:PostProps) {
  if(props.hasLink){
    return(
        <Link href={`/post/${props.postId}`}>
            <PostItemContent {...props}/>
        </Link>
    )
  }
  
  return <PostItemContent {...props}/>
}

function PostItemContent({postId,username,content,commentCount,likeCount,likedByUser,profileId,hasLink,parentId,linksToParent}:PostProps){
    const router = useRouter()
    function handleParentLinkClick(e:React.MouseEvent){
        e.preventDefault(),
        e.stopPropagation(),
        router.push(`/post/${parentId}`)


    }
    return(
        <div className={`flex border-b border-gray-200 p-4 ${hasLink?"hover:bg-gray-100":""}`}>
            <Avatar username={username} profileId={profileId}/> 
            <div className="flex-1">
                <div className="mb-1 flex gap-2">
                    <ProfileLink username={username} className="flex items-center hover:underline">
                    <span className="text-gray-500">@{username}</span>
                    </ProfileLink>
                    {linksToParent && parentId && (<div role="link" className="text-sm italic" onClick={handleParentLinkClick}>
                        <span>@replied</span>
                    </div>)}
                </div>
                <PostContent content={content}/>
                <div className="flex justify-between mt-2 text-gray-500">
                    <button className="flex items-center">
                        <LuMessageCircle className="mr-1  h-5 w-5"/>
                        <span>{commentCount}</span>
                    </button>
                    <LikeCount 
                    likeCount = {likeCount} likedByUser={likedByUser} postId={postId}
                    />
                    <SharePost postId={postId}/>

                    {!parentId && <INVEST/>}

                </div>
            </div>
        </div>
    )
}