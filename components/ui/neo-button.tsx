import * as React from "react"
import { cn } from "@/lib/utils"

export interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
  size?: "default" | "sm" | "lg"
}

const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "relative font-bold transition-transform active:translate-y-1",
          "border-3 border-black",
          "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
          "active:shadow-none",
          variant === "default" && "bg-[#FFD700] hover:bg-[#FFD700]/90",
          variant === "outline" && "bg-white hover:bg-gray-100",
          size === "default" && "h-11 px-4 py-2",
          size === "sm" && "h-9 px-3 text-sm",
          size === "lg" && "h-14 px-8 text-lg",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
NeoButton.displayName = "NeoButton"

export { NeoButton }

