import { getCurrentUser } from '@/server/actions'
import { redirect } from 'next/navigation'
import React from 'react'

const page = async () => {

  const currentUser = await getCurrentUser()

  if(currentUser?.level !== 'ADMIN') {
    redirect('/home')
  }

  return (
    <div className='flex justify-center items-center h-screen'>
        <h1>Halaman Administrator</h1>
    </div>
  )
}

export default page