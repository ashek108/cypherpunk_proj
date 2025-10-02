
function ProfilePage({username}:{username:string}) {
  return (
    <div className="bg-[#161e27] h-[100vh] flex justify-center">
        <div className="h-[100vh] w-[100vw] sm:w-[55vw] lg:w-[40vw]  sm:border-l-[1px] sm:border-r-[1px] border-white/16 overflow-auto">

        {/* //image div */}
            <div className="relative w-full max-h-[150px] overflow-hidden">
                <img className="w-full h-auto object-cover" 
                src="/TempProfileHeaderPhoto.png" 
                />

                {/* button for going back to home   */}
                <button className="absolute top-4 left-5 rounded-4xl bg-black/60 flex justify-center items-center w-7 h-7 sm:w-9 sm:h-9"> 

                  {/* back arrow svg here !*/}
                  <svg fill="none" viewBox="0 0 24 24" width="24" height="24"><path fill="white" fillRule="evenodd" clipRule="evenodd" d="M3 12a1 1 0 0 1 .293-.707l6-6a1 1 0 0 1 1.414 1.414L6.414 11H20a1 1 0 1 1 0 2H6.414l4.293 4.293a1 1 0 0 1-1.414 1.414l-6-6A1 1 0 0 1 3 12Z"></path></svg>
                
                </button>              
            </div>

            {/* Staring Profile info here */}
            <div className="relative w-full flex justify-start h-[3.5rem]">
              <div className="absolute top-[-3rem] left-[1rem] h-[6rem] w-[6rem] overflow-hidden bg-cover bg-[#161e27] rounded-[50%] border-[2px] border-black">
                <img src="/pfp.png" />

              </div>
            </div>
            {/* Staring name and username section here  */}
            <div className="flex justify-start h-fit">
              <div className="pl-5 flex flex-col">
                <div className="text-white font-sans font-bold text-3xl">
                  {/* replace by name after fetch  */}
                  <p>Autism Central</p>
                </div>
                <div className="text-white/50 font-mono pt-1">
                  {/* replace by username after fetch  */}
                  <p>@elonmusk</p>
                </div>
              </div>
            </div>

              {/* starting the followers ,following and posts count section here */}
            <div className="w-full h-fit flex justify-start">
              <div className="flex pl-5">
                <div className="flex">
                  <h1 className="text-white font-sans font-semibold mr-[0.3rem] text">
                    69k
                  </h1>
                  <p className="text-white/50">
                    followers
                  </p>
                </div>
                <div className="flex pl-2">
                  <h1 className="text-white font-sans font-semibold mr-[0.3rem] text ">
                    1.5K
                  </h1>
                  <p className="text-white/50">
                    following
                  </p>
                </div>
                <div className="flex pl-2">
                  <h1 className="text-white font-sans font-semibold mr-[0.3rem] text ">
                    420k
                  </h1>
                  <p className="text-white/50">
                    posts
                  </p>

                </div>
              </div>
            </div>

            {/* Starting aboutme */}
            <div className="w-full h-fit flex justify-start">
              <div className="w-[80%] pl-5 pt-5 pb-5">
                <p className="text-white font">
                  It is important to view knowledge as sort of a semantic tree make sure you understand the fundamental principles
                </p>

              </div>
            </div>

            {/* starting PostMIDNAVBAR */}
            <div className="w-full flex justify-center h-[3.5rem] border-b-[1px] border-white/16 hover:bg-white/3  sticky top-0 z-9999" >
              <div className="w-[5rem] border-b-3 border-blue-500 flex justify-center items-baseline">
                <h1 className="text-white pt-4 text-xl font-semibold font-sans">Posts</h1>
              </div>
            </div>

            {/* test FOR TWEETS  INCOMING*/}
            <div className="w-full h-[500vh]" ></div>

        
        
        </div>
    </div>
  )
}

export default ProfilePage
