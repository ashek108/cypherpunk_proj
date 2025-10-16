"use client"
import { LuShare2 } from "react-icons/lu"
import { useCallback } from "react"

interface SharePostProps {
    postId: string
}


import { LuShare } from "react-icons/lu";
import { toast } from "sonner";

interface SharePostProps{
    postId:string;

}
export default function SharePost({postId}:SharePostProps) {
    function copyPermalink(e:React.MouseEvent){
        e.preventDefault()
        e.stopPropagation()
        const permalink = window.location.origin + "/post/" +postId
        try{
            navigator.clipboard.writeText(permalink);
            toast.message("Copied to Clipboard!")
        }catch(e){
            console.error("Failed to copy to Clipboard")
        }
    }
    return(<button onClick={copyPermalink}>
        <LuShare className="h-5 w-5 "/>
    </button>)
  
}
