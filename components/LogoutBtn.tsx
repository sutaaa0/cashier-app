'use client';

import React from 'react'
import { Button } from './ui/button'
import { Logout } from '@/server/actions'
import { toast } from '@/hooks/use-toast'
import { redirect } from 'next/navigation';

const LogoutBtn = () => {

    const handleLogout = async () => {
        const log = await Logout()

        if(log.status === 'Success') {
            toast({
                title: 'Logout success',
                description: 'You have been logged out',
            })

            redirect('/login')
        }
    }

  return (
    <Button onClick={() => handleLogout() }>Logout</Button>
  )
}

export default LogoutBtn