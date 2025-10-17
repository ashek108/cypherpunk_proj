"use client"
import React, { useOptimistic, useTransition } from "react";
import RequiresAuth from "../auth/RequiresAuth";
import { followProfile, unfollowProfile } from "@/lib/actions/follows";
interface FollowButtonProps {
  followedByUser: boolean;
  profileId: string;
  username:string
}

export default function FollowButton({
  followedByUser,
  profileId,
  username

}: FollowButtonProps) {
  const [pending,startTransition] = useTransition()
  const [optimisticFollowedByUser, setOptimisticFollowedByUser] =
    useOptimistic(followedByUser);

  function handleFollowOrUnFollow(){
    startTransition(async ()=>{
      if(optimisticFollowedByUser){
        setOptimisticFollowedByUser(false)
        await unfollowProfile(profileId,username)
      }else{
        setOptimisticFollowedByUser(true)
        await followProfile(profileId,username)
      }
    })
  }

  return (
    <RequiresAuth
    onClick={handleFollowOrUnFollow}
      className={`flex items-center rounded-3xl px-4 py-2 text-base ${
        optimisticFollowedByUser
          ? "bg-blue-500 hover:bg-gray-400 text-white"
          : "bg-gray-400 hover:bg-blue-500 text-white"
      }`}
    >
      <span>{optimisticFollowedByUser ? "Unfollow" : "Follow"}</span>
    </RequiresAuth>
  );
}
