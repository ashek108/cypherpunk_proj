"use server";
import {z} from "zod"
import { getServerUserId } from "../auth/getServerUserId";
import { createReadOnlyServerClient } from "@/supabase/clients/server";
import { db, posts, profiles } from "../db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";



const createPostSchema = z.object({
    content:z.string().min(1).max(250),
    parentId:z.string().uuid().optional().nullable().transform(v => v?? undefined)
})

export async function createPost(formData:FormData){
    try {
        const userId = await getServerUserId()
        if(!userId){
            throw new Error("User not found");           
        }
        
        // Check if profile exists, create if it doesn't
        const existingProfile = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
        if(existingProfile.length === 0){
            // Try to get username from auth metadata and create profile
            const supabase = await createReadOnlyServerClient();
            const {data: {user}} = await supabase.auth.getUser();
            const username = user?.user_metadata?.username;
            
            if(!username){
                throw new Error("User profile not found and no username available. Please sign out and sign in again.");
            }
            
            // Create the missing profile
            await db.insert(profiles).values({
                id: userId,
                username: username
            });
        }
        const contentSubmission = formData.get("content")
        const parentIdSubmission = formData.get("parentId")
        const {content,parentId} = createPostSchema.parse({
            content:contentSubmission,
            parentId:parentIdSubmission,
        })
        await createPostRecord(userId,content,parentId)
        if(parentId){
            revalidatePath(`/post/${parentId}`)
        }
        revalidatePath("/")
        return {success:true}
    } catch (error) {
        console.error("Error creating post:", error);
        return {success:false, error: error instanceof Error ? error.message : "Unknown error"}
        
    }
}

async function createPostRecord(userId:string,content:string,parentId?:string){
    const [newPost] = await db.insert(posts).values({profileid:userId,content,parentId}).returning()
    return newPost;
}