import Link from "next/link";

export default function MobileHeader() {
  return (
    <header className="fixed flex h-14 w-full items-center justify-center border-b border-gray-200 bg-white p-4 md:hidden ">
        <div>
          <div className="absolute left-4 top-4">

            <div className="aspect-square h-6 w-6 rounded-full bg-gray-200">
          </div>

          </div>
        </div>
        <Link href="/" className="flex justify-center space-x-5 items-center">
            <img className="h-10 w-10" src="/logo.svg" alt="icon"  />
            <h1 className="font-bold text-2xl">CloutX</h1>
        </Link>
      
    </header>
  )
}
