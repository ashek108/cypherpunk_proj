'use client';

import { useWallet } from './WalletContext';

function Navbar() {
  const { connected, connecting, publicKey, connect, disconnect } = useWallet();

  const handleWalletClick = async () => {
    if (connected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  const formatPublicKey = (key: string) => {
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

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

      <div className="flex items-center space-x-4">
        <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition">
          Sign In
        </button>
        <button 
          onClick={handleWalletClick}
          disabled={connecting}
          className={`relative group px-6 py-2 font-semibold text-white rounded-lg transition-all duration-300 mr-0 sm:mr-6 shadow-lg ${
            connected 
              ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-500 hover:shadow-green-500/25' 
              : connecting
              ? 'bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-500 hover:via-blue-500 hover:to-purple-500 hover:shadow-purple-500/25'
          }`}
        >
          <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm ${
            connected 
              ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-600'
              : connecting 
              ? 'bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600'
              : 'bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600'
          }`}></div>
          <span className="relative z-10 flex items-center space-x-2">
            {connecting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting...</span>
              </>
            ) : connected ? (
              <>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  className="text-white"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="hidden sm:inline">{publicKey ? formatPublicKey(publicKey) : 'Connected'}</span>
                <span className="sm:hidden">Connected</span>
              </>
            ) : (
              <>
                <img 
                  src="/phantom.png" 
                  alt="Phantom" 
                  width="20" 
                  height="20"
                  className="text-white"
                />
                <span>Connect Phantom</span>
              </>
            )}
          </span>
        </button>
      </div>
    </header>
  )
}

export default Navbar;
