import {LuUser} from "react-icons/lu"
import ProfileLink from "../profile/ProfileLink"

interface AvatarProps{
    profileId?:string
    username?:string
    size?:number
    link?:boolean

}



export default function Avatar({profileId,username,size = 48,link=true}:AvatarProps) {
    if(!profileId || !username){
        return <div
        style={{width:size}} className="flex items-center aspect-square rounded-full bg-gray-200 justify-center">
            <LuUser className="h-6 w-6 text-gray-400" />
        </div>
    }
    const avatarPlaceholder = `https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=${profileId}`
    if(link){
        return(
            <ProfileLink username={username}>
                <img src={avatarPlaceholder} alt={username??profileId} width={size} height={size} className="mr-4 rounded-full" />
            </ProfileLink>

        )
    }
    return (
        <img src={avatarPlaceholder} alt={username??profileId} width={size} height={size} className="mr-4 rounded-full" />
    )
}
