
function Hero() {
  return (
    <div className="w-full bg-black">
      <div className="pt-[7rem] flex justify-center items-center ">
        <div className="flex flex-col w-2xl justify-centre items-center  gap-3  font-semibold">
          <span className="text-white w-fit text-4xl sm:text-4xl md:text-7xl">Invest in Posts</span>
          <span className="text-white w-fit text-4xl sm:text-4xl md:text-7xl">Ride the Pump</span>
          <p className=" text-[1rem] font-medium text-center text-gray-300/97 w-fit mt-[0.5rem] pl-10 pr-10 ">Turn your scrolling into earning. Buy, pump, sell, and profit from posts effortlessly</p>

        </div>
      </div>

    <div className="w-full h-[5rem]  hidden md:flex justify-center items-center">
      <a  href="/home" className=" bg-linear-65 bg-gradient-to-l from-purple-900 to-blue-900 backdrop-blur-lg cursor-pointer rounded-4xl h-[2.5rem] w-[25rem] border-[1px]  flex items-center justify-center">
        <div className="pl-2 pr-2 w-fit space-x-2 flex shrink-0 ">
          <span><img src="/google-gemini-icon.svg" className="h-[1.5rem] select-none w-[1.5rem]"  /></span>
          <h1 className="text-white font-semibold select-none" >Join the future of doom scrolling Now!</h1>
          <div className="ml-2 w-12 h-[1.5rem] bg-[#155dfc] rounded-4xl border-[1px] border-white/40 flex justify-center items-center">

          <svg xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white"   
              strokeWidth="3"     
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="ml-1 h-4 w-4">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>

          </div>
        </div>

        

      </a>
    </div>



    

    <div className="w-full h-fit mt-[3rem] mb-[3rem] pb-[1rem] pt-[1rem] flex justify-center items-start  "> 

      <div className="absolute w-[80vw] h-[20vh] sm:w-[70vw] sm:h-[70vh] rounded-full bg-conic from-blue-500 to-purple-600 blur-[12rem]  ">
      </div>

      <div className="relative sm:w-[70vw] w-[75vh] p-[0.4rem]   rounded-xl object-contain border-[1px] bg-gray-50/1 backdrop-blur-2xl border-amber-50/16">
          <img src="/PUMP.png" className="rounded-xl border-[1px] border-white/8"/>
      </div>

    </div>


    <div id="howitworks" className="bg-black h-fit w-full scroll-m-24 ">

        <div className="w-full h-fit flex justify-center items-baseline mt-[3rem] bg-black">
          <div className="relative w-[9rem] h-[3rem] flex justify-center items-center font-mono text-white ">
            <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse duration-200 ">
              <div className="w-full h-full bg-black rounded-3xl"></div>
            </div>
            <h1 className="relative z-10">How it works</h1>
          </div>
        </div>

        <div className="m-[1rem] sm:m-[3rem] w-auto text-center h-fit flex justify-center">
          <div className="w-[40rem]">
            <h1 className="text-white font-semibold font-sans text-2xl sm:text-4xl">Three Simple Steps to Start Earning While Scrolling</h1>
          </div>
        </div>

        {/* The flexbox from here --Ad*/}
        <div className="flex flex-col items-center md:flex-row md:justify-center flex-wrap mt-20 pb-24 gap-10 md:gap-16">

          <div className="w-[22rem] h-[20rem] flex flex-col border-[1px] border-white/16 rounded-3xl">
            <div className="pl-[2rem] h-fit mt-10 flex justify-centre items-center w-full overflow-clip">
              <div className=" w-[60px]">
              <img src="/sign in.png"/>
              </div>
            </div>
            <div className="pl-[2rem] w-full h-fit mt-5">
              <h1 className="text-white font-mono text-3xl">I. Sign In</h1>
            </div>
            <div className="pl-[2rem] pr-[2rem] text-start w-full h-fit mt-8">
              <h1 className="text-white/55 font-mono text-1xl">Log in or sign up either by clicking Get Started , or by using the Sign In button</h1>
            </div>
          </div>



          <div className="w-[22rem] h-[20rem] flex flex-col border-[1px] border-white/16 rounded-3xl">
            <div className="pl-[2rem] h-fit mt-10 flex justify-centre items-center w-full overflow-clip">
              <div className=" w-[60px]">
              <img src="/engage.png"/>
              </div>
            </div>
            <div className="pl-[2rem] w-full h-fit mt-5">
              <h1 className="text-white font-mono text-3xl">II. Engage</h1>
            </div>
            <div className="pl-[2rem] pr-[2rem] text-start w-full h-fit mt-8">
              <h1 className="text-white/55 font-mono text-1xl">Like, comment, share, and invest in posts you believe in. Interact with content and discover opportunities to grow </h1>
            </div>
          </div>



          <div className="w-[22rem] h-[20rem] flex flex-col border-[1px] border-white/16 rounded-3xl">
            <div className="pl-[2rem] h-fit mt-10 flex justify-centre items-center w-full overflow-clip">
              <div className=" w-[60px]">
              <img src="/earn.png"/>
              </div>
            </div>
            <div className="pl-[2rem] w-full h-fit mt-5">
              <h1 className="text-white font-mono text-3xl">III. Earn</h1>
            </div>
            <div className="pl-[2rem] pr-[2rem] text-start w-full h-fit mt-8">
              <h1 className="text-white/55 font-mono text-1xl">Turn your activity into rewards. Invest in posts, ride the pump, and earn from the content and trends you support</h1>
            </div>
          </div>


        </div>

        




    </div>
      

      
    </div>
  )
}

export default Hero
