"use client"
import createBrowserClient from "@/supabase/clients/browser";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import {toast} from 'sonner';


interface AuthConnection{
    user:User|null,
    loading:boolean,
    handleSignOut:()=>Promise<void> ;
    handleLogin:(email:string,password:string) => Promise<{success:boolean}>;
    handleSignUp:(email:string,username:string,password:string)=> Promise<{success:boolean}>;
    updateUser:(username:string)=> Promise<{success:boolean}>;
}


const AuthContext = createContext<AuthConnection>({} as AuthConnection);


export default function AuthProvider({children}:{children:React.ReactNode}){
    const router = useRouter();
    const supabase = createBrowserClient()
    const [user,setUser] = useState<User|null>(null)
    const [loading,setLoading] = useState<boolean>(false);

    useEffect(()=>{
        const {data} = supabase.auth.onAuthStateChange((event,session)=>{
            if(event =="SIGNED_IN"|| event == "INITIAL_SESSION" || event =="USER_UPDATED"){
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
        if(error){
            toast.error(error.message)

        }
        else{
            window.location.reload();
        }
        setLoading(false)
    }

    async function handleLogin(email:string,password:string){
        setLoading(true)
        const {error} = await supabase.auth.signInWithPassword({email,password});
        setLoading(false)
        if(error){
            toast.error(error.message)
            return {success:false}
            
        }
        else{
            router.refresh()
            return {success:true}

        }

        

    }

    async function handleSignUp(email:string,username:string,password:string){
        setLoading(true)
        const {data, error} = await supabase.auth.signUp({email,password,options:{
            data:{username}
        }});
        setLoading(false)
        if(error){
            if(error.message == "Database error saving new user"){
                toast.error("username already taken")
            }
            toast.error(error.message)
            return {success:false}
        }
        else{
            // Create profile record in database
            if(data.user) {
                const {error: profileError} = await supabase
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        username: username
                    });
                
                if(profileError) {
                    toast.error("Failed to create profile: " + profileError.message);
                    return {success: false};
                }
            }
            router.refresh()
            return {success:true}
        }

        

    }

    async function updateUser(username:string){

        setLoading(true)
        
        // Update auth metadata
        const {error: authError} = await supabase.auth.updateUser({data:{username}});
        
        if(authError){
            setLoading(false)
            if(authError.message == "Database error saving new user"){
                toast.error("username already taken")
            }else{
                toast.error(authError.message)
            }
            return {success:false}
        }

        // Update profile in database
        if(user) {
            const {error: profileError} = await supabase
                .from('profiles')
                .update({username: username})
                .eq('id', user.id);
            
            if(profileError) {
                setLoading(false)
                toast.error("Failed to update profile: " + profileError.message);
                return {success: false};
            }
        }

        setLoading(false)
        router.refresh()
        return {success:true}

    }

    return (
        <AuthContext.Provider value={{
            user,loading,handleSignOut,handleLogin,handleSignUp,updateUser
        }} >
            {children}
        </AuthContext.Provider>
    )
}


export function useAuth(){
    const context = useContext(AuthContext)
    if(!context){
        throw new Error("useAuth must be used within an AuthProvider");
        
    }
    return context
}