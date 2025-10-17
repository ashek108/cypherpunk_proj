import { getProfileByUsername } from '@/lib/data/profile/getProfile'
import React from 'react'

export default async function ProfileUsernamePage({params}:{params:{profileUsername:string}}) {
  const profileUsername = (await params).profileUsername
  const usernameParsed =  decodeURIComponent(profileUsername)
  const profile = getProfileByUsername(usernameParsed)
  return (
    <div>
      {profileUsername}
    </div>
  )
}
