"use server"
import { eq,and } from "drizzle-orm"
import { getServerUserId } from "../auth/getServerUserId"
import { db, likes } from "../db"
import { revalidatePath } from "next/cache"

export async function unlikePost(postId:string,path:string){
    const userId = await getServerUserId()
    if(!userId){
        return
    }
    await db.delete(likes)
        .where(and(eq(likes.profileId, userId), eq(likes.postId, postId)))
    revalidatePath(path)
}
export async function likePost(postId:string,path:string){
    const userId = await getServerUserId()
    if(!userId){
        return
    }
    const existingLike = await db.select().from(likes)
        .where(and(eq(likes.profileId,userId),eq(likes.postId,postId)))
    if(existingLike.length){
        return
    }
    await db.insert(likes).values({postId,profileId:userId})
    revalidatePath(path)
}


const sleep = (delay:number)=> new Promise((resolve)=>setTimeout(resolve,delay))