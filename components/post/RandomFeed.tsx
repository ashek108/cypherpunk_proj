"use client"
import React, { useEffect, useRef, useState } from "react";
import Post from "./Post";

type FeedPost = React.ComponentProps<typeof Post>;

export default function RandomFeed({ initial }: { initial: FeedPost[] }){
  const [posts, setPosts] = useState<FeedPost[]>(initial);
  const [offset, setOffset] = useState<number>(initial.length);
  const [loading, setLoading] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if(!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if(entry.isIntersecting && !loading){
        setLoading(true)
        const res = await fetch(`/api/posts/random?limit=10&offset=${offset}`);
        const data = await res.json();
        setPosts(prev => [...prev, ...data.posts]);
        setOffset(prev => prev + data.posts.length)
        setLoading(false)
      }
    }, { rootMargin: "200px"});
    observer.observe(el);
    return () => observer.disconnect();
  }, [offset, loading]);

  return (
    <div>
      {posts.map((p) => (
        <Post key={`${p.postId}-${p.createdAt}`} {...p} />
      ))}
      <div ref={sentinelRef} />
      {loading && <div className="p-4 text-center text-gray-500">Loading…</div>}
    </div>
  )
}


