import Header from "@/components/layout/Header";
import FollowButton from "@/components/profile/FollowButton";
import Avatar from "@/components/ui/Avatar";
import { getProfileByUsername } from "@/lib/data/profile/getProfile";
import { notFound } from "next/navigation";
import React from "react";

export default async function ProfileUsernamePage({
  params,
}: {
  params: { profileUsername: string };
}) {
  const profileUsername = (await params).profileUsername;
  const usernameParsed = decodeURIComponent(profileUsername);
  const { profile, isOwnProfile } = await getProfileByUsername(usernameParsed);
  if (!profile) {
    notFound();
  }

  return (
    <div>
      <Header hasBackButton>
        <div className="flex w-full items-centre gap-2">
        <Avatar
          username={profile.username}
          profileId={profile.id}
          link={false}
        /> 
        
        {!isOwnProfile && 
          <div className="flex w-full items-center justify-between">
            <h1>{usernameParsed}</h1>
            <FollowButton 
            profileId={profile.id}
            followedByUser={!!profile.followedByUser}
            username={usernameParsed}
            />
          </div>
        }
        </div>
      </Header>
    </div>
  );
}
