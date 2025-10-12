import {LuUser} from "react-icons/lu"

interface AvatarProps{
    profileId?:string
    username?:string
    size?:number

}



export default function Avatar({profileId,username,size = 48}:AvatarProps) {
    if(!profileId || !username){
        return <div
        style={{width:size}} className="flex items-center aspect-square rounded-full bg-gray-200 justify-center">
            <LuUser className="h-6 w-6 text-gray-400" />
        </div>
    }
    const avatarPlaceholder = `https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${profileId}`
  return ( <img src={avatarPlaceholder} width={size} height={size} className="mr-4 rounded-full" />
  )
}
