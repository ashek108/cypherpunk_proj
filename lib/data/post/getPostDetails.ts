import { getServerUserId } from "@/lib/auth/getServerUserId";
import { db, likes, posts, profiles } from "@/lib/db";
import { eq,sql,and, isNull, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import 'server-only';



export async function getPostDetails(postId:string){
    const userId = await getServerUserId()
    const userLikes = alias(likes,"userLikes")
    const childPosts = alias(posts,"childPosts")
    const postQuery  =  db.select({
        postId: posts.id,
        content:posts.content,
        createdAt:posts.createdAt,
        profileId:posts.profileid,
        parentId: posts.parentId,
        username:profiles.username,
        likeCount:sql<number>`CAST(COUNT(DISTINCT ${likes.id}) as int)`,
        ...(userId?{likedByUser:sql<boolean>`count(${userLikes.id}) > 0`}
            :{})
    }).from(posts).innerJoin(profiles,eq(posts.profileid,profiles.id)).leftJoin(likes,eq(likes.postId,posts.id))
    .where(eq(posts.id,postId))
    .groupBy(posts.id,profiles.id);
    if(userId){
        postQuery.leftJoin(userLikes, and(eq(userLikes.postId, posts.id), eq(userLikes.profileId, userId)))

    }
    const repliesQuerry = db.select({ 
        postId: posts.id,
        content:posts.content,
        createdAt:posts.createdAt,
        profileId:posts.profileid,
        parentId: posts.parentId,
        username:profiles.username,
        likeCount:sql<number>`CAST(COUNT(DISTINCT ${likes.id}) as int)`,
        commentCount:sql<number>`CAST(COUNT(DISTINCT ${childPosts.id}) as int)`,
        ...(userId?{likedByUser:sql<boolean>`count(${userLikes.id}) > 0`}
            :{})
    }).from(posts).innerJoin(profiles,eq(posts.profileid,profiles.id))
    .leftJoin(likes,eq(likes.postId,posts.id))
    .leftJoin(childPosts,eq(childPosts.parentId,posts.id))
    .where(eq(posts.parentId,postId))
    .groupBy(posts.id,profiles.id);
    if(userId){repliesQuerry.leftJoin(userLikes, and(eq(userLikes.postId, posts.id), eq(userLikes.profileId, userId)))
    }
    const [postResult,repliesResult] = await Promise.all([postQuery,repliesQuerry]);
    const [post] = postResult;
    return {post,replies:repliesResult};
}

export async function getPostsByProfileId(profileId:string){
    const userId = await getServerUserId()
    const userLikes = alias(likes,"userLikes")
    const childPosts = alias(posts,"childPosts")
    const query = db.select({
        postId: posts.id,
        content:posts.content,
        createdAt:posts.createdAt,
        profileId:posts.profileid,
        parentId: posts.parentId,
        username:profiles.username,
        likeCount:sql<number>`CAST(COUNT(DISTINCT ${likes.id}) as int)`,
        commentCount:sql<number>`CAST(COUNT(DISTINCT ${childPosts.id}) as int)`,
        ...(userId?{likedByUser:sql<boolean>`count(${userLikes.id}) > 0`}:{}),
        hasLink: sql<boolean>`true`,
        linksToParent: sql<boolean>`false`
    }).from(posts)
    .innerJoin(profiles,eq(posts.profileid,profiles.id))
    .leftJoin(likes,eq(likes.postId,posts.id))
    .leftJoin(childPosts,eq(childPosts.parentId,posts.id))
    .where(and(eq(posts.profileid,profileId), isNull(posts.parentId)))
    .groupBy(posts.id,profiles.id)
    .orderBy(desc(posts.createdAt))
    
    if(userId){
        query.leftJoin(userLikes, and(eq(userLikes.postId, posts.id), eq(userLikes.profileId, userId)))
    }
    return query
}

export async function getRandomPosts(limit:number = 20, offset:number = 0){
    const userId = await getServerUserId()
    const userLikes = alias(likes,"userLikes")
    const childPosts = alias(posts,"childPosts")
    // Use random ordering via SQL; drizzle doesn't have a helper, so use raw
    const query = db.select({
        postId: posts.id,
        content:posts.content,
        createdAt:posts.createdAt,
        profileId:posts.profileid,
        parentId: posts.parentId,
        username:profiles.username,
        likeCount:sql<number>`CAST(COUNT(DISTINCT ${likes.id}) as int)`,
        commentCount:sql<number>`CAST(COUNT(DISTINCT ${childPosts.id}) as int)`,
        ...(userId?{likedByUser:sql<boolean>`count(${userLikes.id}) > 0`}:{}),
        hasLink: sql<boolean>`true`,
        linksToParent: sql<boolean>`false`
    }).from(posts)
    .innerJoin(profiles,eq(posts.profileid,profiles.id))
    .leftJoin(likes,eq(likes.postId,posts.id))
    .leftJoin(childPosts,eq(childPosts.parentId,posts.id))
    .where(isNull(posts.parentId))
    .groupBy(posts.id,profiles.id)
    .orderBy(sql`random()`) // postgres RANDOM()
    .limit(limit)
    .offset(offset)

    if(userId){
        query.leftJoin(userLikes, and(eq(userLikes.postId, posts.id), eq(userLikes.profileId, userId)))
    }
    return query
}