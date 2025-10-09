interface SubmitButtonProps{
    className:string,
    children:React.ReactNode,
    loading?:boolean,
}

export default function SubmitButton({ className,children,loading}:SubmitButtonProps){
    return (
        <button type="submit" className={`flex items-center gap-2 rounded-3xl bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} disabled={loading}>{children}</button>
    )

}