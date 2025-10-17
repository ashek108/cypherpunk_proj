import { NextRequest, NextResponse } from "next/server";
import { getRandomPosts } from "@/lib/data/post/getPostDetails";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);
  const posts = await getRandomPosts(limit, offset);
  return NextResponse.json({ posts });
}


