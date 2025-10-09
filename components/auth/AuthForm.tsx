"use client"
import { useAuth } from "@/lib/providers/AuthProvider";
import { useState } from "react";

interface AuthFormProps {
    type:"login"|"signup";
}


export default function AuthForm({type}:AuthFormProps) {
    const {handleSignUp,handleLogin,loading} = useAuth()
    const [username,setUsername] = useState("")
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")


    function handleSubmit(e:React.FormEvent){
        e.preventDefault()
        if (type == 'login' ){
            handleLogin(email,password)
        }
        if(type == 'signup'){

            handleSignUp(email,username,password)
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
                <input type="text" name="password" id="password" autoComplete="password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-2xl border border-gray-300 p-2" />
            </div>
        
        </form>
    )
}
