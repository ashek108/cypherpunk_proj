import { useAuth } from "@/lib/providers/AuthProvider";

interface AuthFormProps {
    type:"login"|"signup";
}


export default function AuthForm({type}:AuthFormProps) {
    const {handleSignUp,handleLogin,loading} = useAuth()
    return (<><h1>AuthForm</h1></>)

}
