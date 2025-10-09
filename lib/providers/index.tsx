"use client";
import { Toaster } from "sonner";
import AuthProvider from "./AuthProvider";
export default function Providers({children}:{children:React.ReactNode}){
    return(
       <AuthProvider>
        <Toaster/>
        {children}
       </AuthProvider>
    )
}
