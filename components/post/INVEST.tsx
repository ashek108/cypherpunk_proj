
import { LuDollarSign } from "react-icons/lu"

export default function INVEST() {
    return (
        <button className="ml-3 flex items-center text-gray-500 hover:text-black">
            <LuDollarSign className="h-5 w-5" />
            <span className="ml-1">Invest</span>
        </button>
    )
}

