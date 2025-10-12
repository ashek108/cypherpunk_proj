"use client"
import { useAuth } from "@/lib/providers/AuthProvider";
import { useState } from "react";
import SubmitButton from "../ui/SubmitButton";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AuthFormProps {
    type:"login"|"signup";
}


export default function AuthForm({type}:AuthFormProps) {
    const router = useRouter();
    const {handleSignUp,handleLogin,loading} = useAuth()
    const [username,setUsername] = useState("")
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")


    async function handleSubmit(e:React.FormEvent){

        e.preventDefault()
        if (type == 'login' ){
            const {success} = await  handleLogin(email,password)
            if (success){
                router.replace("/home")

            }
        }
        if(type == 'signup'){
            const {success} = await  handleLogin(email,password)
            if (success){
                router.replace("/home")
                
            }
        }
    }

    return (
        <form className="flex flex-col space-y-4 p-4 md:p-6" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-semibold text-gray-600">
                {type == "login"?"Sign In":"Sign Up"}
            </h2>
            {type == "signup" && (
                <div className="flex flex-col gap-1">
                    <label htmlFor="username">Username</label>
                    <input type="text" name="username" id="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} className="rounded-2xl border border-gray-300 p-2" />
                </div>

            )}
            <div className="flex flex-col gap-1">
                <label htmlFor="email">Email</label>
                <input minLength={6} type="text" name="email" id="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-2xl border border-gray-300 p-2" />
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="password">Password</label>
                <input type="text" name="password" id="password" autoComplete={type == "signup"?"new-password":"current-password"} value={password} onChange={e => setPassword(e.target.value)} className="rounded-2xl border border-gray-300 p-2" />
            </div>
        <SubmitButton loading={loading} className="w-max px-8">
            {type == "signup"?"Sign Up":"Login"}
        </SubmitButton>
        <p>
            {type == "signup"?"Already have an account?":"Don't have an account?"}
            <Link href={`/${type=="signup"?'login':'sign-up'}`}
            className="ml-2 text-blue-500 "
            >
            {type == "signup"?"Login":"Sign Up"}
            </Link>
        </p>
        </form>
    )
}
