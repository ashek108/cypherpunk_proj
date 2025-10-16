import { eq,and } from "drizzle-orm"
import { getServerUserId } from "../auth/getServerUserId"
import { db, likes } from "../db"
import { revalidatePath } from "next/cache"

export async function unlikePost(postId:string){

}
export async function likePost(postId:string){
    const userId =await getServerUserId()
    if(userId){
        const existingLike = await db.select().from(likes)
        .where(and(eq(likes.profileId,userId),eq(likes.postId,postId)))    
        if(existingLike.length){
            return;
        }    
        await db.insert(likes).values({postId,profileId:userId})


    }
    revalidatePath(`/post/${postId}`)
}


const sleep = (delay:number)=> new Promise((resolve)=>setTimeout(resolve,delay))