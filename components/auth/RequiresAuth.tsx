import { useAuth } from "@/lib/providers/AuthProvider"
import {useRouter} from "next/navigation"
import React from "react"
import { toast } from "sonner"

interface RequiresAuthProps{
    children:React.ReactNode;
    onClick?: (e:React.MouseEvent) => void;
    className?:string;
    as?:"button"|"div"|"span";
}

export default function RequiresAuth({onClick,className,children,as = "button"}:RequiresAuthProps) {
    const {user} = useAuth()
    const router = useRouter()
    const Component = as
    function handleClick(e:React.MouseEvent){
        
        if(!user){
            e.preventDefault()
            e.stopPropagation()
            toast("You must be logged in to do that")
            router.push("/login")
        } else if(onClick){
            onClick(e);
        }
    } 

    return (
        <Component onClick={handleClick} className={className}>
            {children}
        </Component>
  )
}
