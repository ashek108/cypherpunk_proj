"use client"
import React, { useRef } from 'react'
import SubmitButton from '../ui/SubmitButton';
import RequiresAuth from '../auth/RequiresAuth';
import Avatar from '../ui/Avatar';
import { useAuth } from '@/lib/providers/AuthProvider';
import { createPost } from '@/lib/actions/createPost';
import { toast } from 'sonner';

interface NewPostForm{
    className?:string;
    parentId?:string;
    autoFocus?:boolean;
    onPostCreated?:()=>void;
    replyToUsername?: string;
}

export default function NewPostForm({parentId,onPostCreated,autoFocus=false,className,replyToUsername}:NewPostForm) {
  const {user} = useAuth()
  const ref = useRef<HTMLFormElement>(null)
  async function handleFormAction(formData:FormData){
    const {success}= await createPost(formData)
    if(success){
      if (parentId) {
        toast("Reply posted")
      } else {
        toast("Post created")
      }
      if(onPostCreated){
        onPostCreated()
      }
      ref?.current?.reset()
    }
    else{
      if (parentId) {
        toast.error("Reply couldn't be posted!")
      } else {
        toast.error("Post couldn't be created!")
      }
    }
  }
  return (
    <form className={`border-b border-gray-200 ${parentId?"p-3":"p-4"} ${className}`}
    action={handleFormAction} ref={ref}
    >
        <div className='mb-4 flex w-full items-start gap-4'>
            <Avatar username={user?.user_metadata?.username} profileId={user?.id}/>
            <textarea name="content" 
            required 
            autoFocus={autoFocus} 
            maxLength={250}
            rows={parentId?2:3}
            placeholder={parentId?`Reply to @${replyToUsername ?? ''}`:"What's happening.."} 
            className='w-full rounded-lg p-2 text-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 '
            />
            {parentId && <input type='hidden' name='parentId' value={parentId} />}
        </div>
        <div className='flex items-center justify-end'>
            <RequiresAuth>
              <SubmitButton>{parentId?"Reply":"Post"}</SubmitButton>
            </RequiresAuth>
        </div>
    </form>
  )
}
