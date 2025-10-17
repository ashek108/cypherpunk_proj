
import Header from "@/components/layout/Header";
import NewPostForm from "@/components/post/NewPostForm";
import Post from "@/components/post/Post";
import { getServerUserId } from "@/lib/auth/getServerUserId";
import { getPostDetails } from "@/lib/data/post/getPostDetails";
import { notFound } from "next/navigation";



interface PostPageProps{
    params:{
        postId:string;
    };
}


export default async function PostPage({params}:PostPageProps){
    const {post,replies} = await getPostDetails((await params).postId )
    if(!post){
        notFound()
    }
    return <div>
        <Header hasBackButton>
            <h1>Posts</h1>
        </Header>
        <Post {...post} commentCount={0}  />
        <NewPostForm parentId={(await params).postId} replyToUsername={post.username} />
        {replies.map(reply=>(<Post {...reply} key={reply.postId} />))}
        </div>
}


