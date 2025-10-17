import { getServerUserId } from "@/lib/auth/getServerUserId";
import { db, follows, profiles } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import "server-only";
export async function getCurrentProfileName() {
  const userId = await getServerUserId();
  if (!userId) {
    return null;
  }
  const [profile] = await db
    .select({ username: profiles.username })
    .from(profiles)
    .where(eq(profiles.id, userId));
  return profile?.username ? profile.username : null;
}
export async function getProfileByUsername(username: string) {
  const userId = await getServerUserId();
  let profileQuerry = db
    .select({
      id: profiles.id,
      username: profiles.username,
      ...(userId ? { followedByUser: follows.followerId } : {}),
    })
    .from(profiles)
    .where(eq(profiles.username, username));
  if (userId) {
    profileQuerry = profileQuerry.leftJoin(
      follows,
      and(eq(follows.followedId, profiles.id), eq(follows.followerId, userId))
    );
  }
  const [profile] = await profileQuerry;
  const isOwnProfile = profile?.id == userId;
  return { profile: profile ? profile : null, isOwnProfile };
}

export async function getFollowings(profileId: string) {
  // Users that the given profile is following
  const rows = await db
    .select({ id: profiles.id, username: profiles.username })
    .from(follows)
    .leftJoin(profiles, eq(profiles.id, follows.followedId))
    .where(eq(follows.followerId, profileId));
  return rows
    .filter((r) => r.username)
    .map((r) => ({ id: r.id as string, username: r.username as string }));
}
