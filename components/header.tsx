'use client'

import { format } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Clock } from 'lucide-react'

export function Header() {
  const now = new Date()
  
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {format(now, 'EEE, dd MMM yyyy')}
          </span>
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(now, 'HH:mm')} {format(now, 'a').toUpperCase()}
          </span>
        </div>
        <Button variant="outline" size="sm">
          Close Order
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Customer&apos;s Name</div>
          <div className="text-sm">Order Number: #000</div>
        </div>
      </div>
    </div>
  )
}

