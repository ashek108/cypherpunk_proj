
import Header from "@/components/layout/Header";
import NewPostForm from "@/components/post/NewPostForm";
import Post from "@/components/post/Post";
import { getServerUserId } from "@/lib/auth/getServerUserId";
import { db, likes, posts, profiles } from "@/lib/db";
import { eq,sql,and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { notFound } from "next/navigation";


async function getPostDetails(postId:string,userId?:string){
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




interface PostPageProps{
    params:{
        postId:string;
    };
}


export default async function PostPage({params}:PostPageProps){
    const userId = await getServerUserId();
    const {post,replies} = await getPostDetails((await params).postId , userId)
    if(!post){
        notFound()
    }
    return <div>
        <Header>
            <h1>Posts</h1>
        </Header>
        <Post {...post} commentCount={0}  />
        <NewPostForm parentId={(await params).postId} replyToUsername={post.username} />
        {replies.map(reply=>(<Post {...reply} key={reply.postId} />))}
        </div>
}


