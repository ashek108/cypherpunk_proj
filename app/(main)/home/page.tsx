import Header from "@/components/layout/Header";
import NewPostForm from "@/components/post/NewPostForm";
import { getRandomPosts } from "@/lib/data/post/getPostDetails";
import RandomFeed from "@/components/post/RandomFeed";

export default async function HomePage() {
  const posts = await getRandomPosts(20)
  return (
    <>
    <Header>
      <h1>Home</h1>
    </Header>
    <NewPostForm/>
    <RandomFeed initial={posts} />
    </>
  )
}
