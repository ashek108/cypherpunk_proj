"use client"
import { usePathname } from "next/navigation";
import { FaHome,FaUser, } from "react-icons/fa";
import { RiLoginBoxFill } from "react-icons/ri";
import Link from "next/link";
import { useAuth } from "@/lib/providers/AuthProvider";
import { LuLogOut } from "react-icons/lu";
import React from "react";

export default function Nav() {
    const {user,handleSignOut,loading} = useAuth()
    const pathname = usePathname();
    const links = [
        {icon:FaHome,text:'Home',link:"/home"},
        {icon:FaUser, text:"Profile",link:"/profile"},
        ...(user?[{icon:LuLogOut,text:'Logout',onclick :handleSignOut}]:[{icon:RiLoginBoxFill,text:"Login",link:"/login"}])
    ]
    
    function isActive(link:string){
        return link == "/home"? pathname == link:pathname.startsWith(link);
    }

    return (
    <nav className="flex justify-around py-2 md:flex-col md:gap-2 md:py-8">
        {links.map((item,index)=>(
            <React.Fragment key={item.text}>
            {item.link?(<Link href={item.link} key={index} className={`flex w-max flex-col gap-2 items-center rounded-3xl text-xs md:flex-row md:py-3 md:pl-4 md:pr-8 md:text-xl md:hover:bg-gray-100 ${isActive(item.link)?"font-bold":"font-medium"}`}>
                <item.icon className="mb-1 h-6 w-6 md:mb-0 md:mr-4 md:h-7 md:w-7"/>
            
                <span>{item.text}</span>

            </Link>)
            : <button onClick={item.onclick} className="flex w-max flex-col gap-2 items-center rounded-3xl text-xs md:flex-row md:py-3 md:pl-4 md:pr-8 md:text-xl md:hover:bg-gray-100">
                <item.icon className="mb-1 h-6 w-6 md:mb-0 md:mr-4 md:h-7 md:w-7"/>
                <span>{item.text}</span>
            </button>
            }
            </React.Fragment>                
        ))}
    </nav>
  )
}
