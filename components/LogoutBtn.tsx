'use client';

import React from 'react'
import { Button } from './ui/button'
import { Logout } from '@/server/actions'
import { toast } from '@/hooks/use-toast'
<<<<<<< HEAD
import { redirect } from 'next/navigation';
=======
>>>>>>> 2356d831e984267b1eeff2ee7a36959fb1aedfec

const LogoutBtn = () => {

    const handleLogout = async () => {
        const log = await Logout()

        if(log.status === 'Success') {
            toast({
                title: 'Logout success',
                description: 'You have been logged out',
            })
<<<<<<< HEAD

            redirect('/login')
=======
>>>>>>> 2356d831e984267b1eeff2ee7a36959fb1aedfec
        }
    }

  return (
    <Button onClick={() => handleLogout() }>Logout</Button>
  )
}

export default LogoutBtn