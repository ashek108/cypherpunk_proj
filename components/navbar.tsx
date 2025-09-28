
function Navbar() {
  return (
    <header className=" font-mono sticky inset-x-0 bg-black top-0 z-50 h-14 w-full  px-6 flex items-center justify-between backdrop-blur-lg border-b-[0.3px] border-gray-100/16">
      

      <div className="flex items-center space-x-3.5 ml-2 sm:ml-6">
        <img src="/logo.svg" className="h-[2rem] w-[2rem]" />
        <span className="text-white font-bold text-lg">CloutX</span>
      </div>

      <nav className="hidden md:flex space-x-6 text-white">
        <a href="/#howitworks" className="hover:text-blue-400">How It Works</a>
        <a href="/sign-up" className="hover:text-blue-400">Get Started</a>
      </nav>

      <div>
        <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition mr-0 sm:mr-6">
          Sign In
        </button>
      </div>
    </header>
  )
}

export default Navbar;
