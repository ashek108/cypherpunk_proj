import LeftSideBar from "@/components/layout/LeftSideBar"
import MobileHeader from "@/components/layout/MobileHeader"
import RightSidebar from "@/components/layout/RightSideBar"
import Toolbar from "@/components/layout/Toolbar"


export default function Main() {
  return (
    <div className="mx-auto lg:max-w-5xl flex flex-col bg:white min-h-screen">
      <MobileHeader/>
      <div className="flex flex-1 md:h-screen">
        <LeftSideBar/>
        <main className="mt-14 w-full overflow-y-auto border-r border-gray-200 pb-16 md:mt-0 md:w-1/2 md:pb-0 xl:w-3/5">


        </main> 
        <RightSidebar/>
      </div>
      <Toolbar />
    </div>
  )
}
