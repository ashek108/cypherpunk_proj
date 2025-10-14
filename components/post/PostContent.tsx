import { hashtagRegex } from "@/lib/constants"

interface PostContentProps{
    content:string
}

export default function PostContent({content}:PostContentProps){
    function parseContent(text:string){
        const parts  = text.split(hashtagRegex);
        
        return parts.map((part,index)=>{
            if(index%2==1){
                return <span key={index} role="link" className="cursor-pointer text-blue-500 hover:underline">#{part}</span>
            }else{
                return part;
            }
        })
    }
    return <p>{parseContent(content)} </p>
}