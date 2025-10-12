"use client"
import React from 'react'
import SubmitButton from '../ui/SubmitButton';
import RequiresAuth from '../auth/RequiresAuth';
import Avatar from '../ui/Avatar';
import { useAuth } from '@/lib/providers/AuthProvider';

interface NewPostForm{
    className?:string;
    parentId?:string;
    autoFocus?:boolean;
    onPostCreated?:()=>void;
}

export default function NewPostForm({parentId,onPostCreated,autoFocus=false,className}:NewPostForm) {
  const {user} = useAuth()
  async function handleFormAction(formData:FormData){
    
  }
  return (
    <form className={`border-b border-gray-200 p-4 ${className}`}
    action={handleFormAction}
    >
        <div className='mb-4 flex w-full items-start gap-4'>
            <Avatar username={user?.user_metadata?.username} profileId={user?.id}/>
            <textarea name="content" 
            required 
            autoFocus={autoFocus} 
            maxLength={250}
            rows={3}
            placeholder="What's happening.." 
            className='w-full rounded-lg p-2 text-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 '
            />
            {parentId && <input type='hidden' name='parentId' value={parentId} />}
        </div>
        <div className='flex items-center justify-end'>
            <RequiresAuth>
              <SubmitButton>Post</SubmitButton>
            </RequiresAuth>
        </div>
    </form>
  )
}
