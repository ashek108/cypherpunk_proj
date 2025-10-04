import Link from "next/link"
import Nav from "./Nav"

export default function LeftSideBar() {
  return (
    <aside className="hidden w-1/4 overflow-y-auto border-r border-gray-200 p-6 md:sticky md:block h-screen xl:w-1/5">
        <Link className="mb-8 flex space-x-3" href="/home">
            <img src="/logo.svg" className="h-8 w-8 text-gray-800" alt="logo" />
            <h1 className="font-bold text-2xl">CloutX</h1>
        </Link>
        <Nav/>      
    </aside>
  )
}
