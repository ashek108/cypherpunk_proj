"use server";
import { eq, and } from "drizzle-orm";
import { getServerUserId } from "../auth/getServerUserId";
import { db, follows, likes } from "../db";
import { revalidatePath } from "next/cache";

export async function followProfile(profileId: string,username:string) {
  const userId = await getServerUserId();
  if (!userId) {
    return;
  }
  const existingFollow = await db
    .select()
    .from(follows)
    .where(
      and(eq(follows.followerId, userId), eq(follows.followerId, profileId))
    );
  if (existingFollow.length) {
    return;
  }
  await db
    .insert(follows)
    .values({ followerId: userId, followedId: profileId });
  revalidatePath(`/profile/${username}`);
}

export async function unfollowProfile(profileId: string,username:string) {
  const userId = await getServerUserId();
  if (!userId) {
    return;
  }
  const existingFollow = await db
    .select()
    .from(follows)
    .where(
      and(eq(follows.followerId, userId), eq(follows.followerId, profileId))
    );
  if (!existingFollow.length) {
    return;
  }
  await db
    .delete(follows)
    .where(
      and(eq(follows.followerId, userId), eq(follows.followedId, profileId))
    );
  revalidatePath(`/profile/${username}`);
}

const sleep = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));
