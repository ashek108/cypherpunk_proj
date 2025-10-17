import { getCurrentProfileName } from "@/lib/data/profile/getProfile";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const currentUsername = await getCurrentProfileName();
  if (currentUsername) {
    redirect(`/profile/${currentUsername}`);
  } else {
    redirect(`/login`);
  }
  return <></>;
}
