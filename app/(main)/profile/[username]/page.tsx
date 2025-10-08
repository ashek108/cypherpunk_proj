import ProfilePage from "@/components/ProfilePage"

export default async function Profile({params}:{params:{username:string}}){
    const username =  (await params).username
    //run your fetching here >_<
    //will change the params later
    return(
        <ProfilePage username={username}/> 
    )
}
