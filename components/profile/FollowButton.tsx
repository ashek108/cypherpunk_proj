import React from "react";
import RequiresAuth from "../auth/RequiresAuth";
interface FollowButtonProps{
    followedByUser:boolean
    profileId:string
}

export default function FollowButton({followedByUser,profileId}:FollowButtonProps) {
  return <RequiresAuth className={`flex items-center rounded-3xl px-4 py-2 text-base ${followedByUser?'bg-blue-500 hover:bg-gray-400':"bg-gray-400 hover:bg-blue-500"}`}>
    <span>{followedByUser?"Unfollow":"Follow"}</span>
    </RequiresAuth>;
}
