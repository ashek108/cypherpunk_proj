"use client"
import { useRouter } from "next/navigation"

interface ProfileProps{
    children:React.ReactNode,
    username:string,
    className?:string
}

export default function ProfileLink({
    children,
    username,
    className
}:ProfileProps) {
    const router = useRouter()
    function handleClick(e:React.MouseEvent){
        e.preventDefault(),
        e.stopPropagation(),
        router.push(`/profile/${username}`)

    }
    return (
        <div className={className} onClick={handleClick} role="button">
            {children}
        </div>
  )
}
