
import createBrowserClient from "@/supabase/clients/browser";
import { User } from "@supabase/supabase-js";
import { createContext, useEffect, useState } from "react";

interface AuthConnection{
    user:User|null,
    loading:boolean,
    handleSignOut:()=>Promise<void> ;
    handleLogin:(email:string,password:string) => Promise<void>;
    handleSignUp:(email:string,username:string,password:string)=> Promise<void>;
    updateUser:(username:string)=> Promise<{success:boolean}>;
}


const AuthContext = createContext<AuthConnection>({} as AuthConnection);


export default function AuthProvider({children}:{children:React.ReactNode}){
    const supabase = createBrowserClient()
    const [user,setUser] = useState<User|null>(null)
    const [loading,setLoading] = useState<boolean>(true);

    useEffect(()=>{
        const {data} = supabase.auth.onAuthStateChange((event,session)=>{
            if(event =="SIGNED_IN"|| event == "INITIAL_SESSION" || event == "USER_UPDATED"){
                setUser(session?.user ?? null)
            }
        });
        return ()=>{
            data?.subscription.unsubscribe();
        }
    },[]);

    async function handleSignOut(){
        setLoading(true)
        const {error}= await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{
            user,loading,
        }} >
            {children}
        </AuthContext.Provider>
    )
}


