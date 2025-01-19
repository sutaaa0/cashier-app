"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, Zap, AlertTriangle } from 'lucide-react'

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-3",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden p-4 pr-8 transition-all before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-black data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3 [&>svg]:h-6 [&>svg]:w-6 [&>svg]:stroke-[2.5px]",
  {
    variants: {
      variant: {
        default: [
          "bg-[#93B8F3] border-[3px] border-black text-black",
          "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
          "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          "active:translate-x-[4px] active:translate-y-[4px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "after:bg-[#000] before:bg-[#000]",
          "animate-[wiggle_1s_ease-in-out]",
          "[&>svg]:text-black",
        ].join(" "),
        destructive: [
          "bg-[#FF6B6B] border-[3px] border-black text-white",
          "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
          "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          "active:translate-x-[4px] active:translate-y-[4px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "after:bg-[#000] before:bg-[#000]",
          "animate-[shake_0.5s_ease-in-out]",
          "[&>svg]:text-white",
        ].join(" "),
        success: [
          "bg-[#7BF7AA] border-[3px] border-black text-black",
          "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
          "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          "active:translate-x-[4px] active:translate-y-[4px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "after:bg-[#000] before:bg-[#000]",
          "animate-[bounce_0.5s_ease-in-out]",
          "[&>svg]:text-black",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {variant === 'destructive' && <AlertTriangle className="absolute" />}
      {variant === 'success' && <Zap className="absolute" />}
      {props.children}
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-9 shrink-0 items-center justify-center rounded-none border-[3px] border-black bg-white px-4 text-sm font-bold",
      "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
      "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
      "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
      "disabled:pointer-events-none disabled:opacity-50",
      "group-[.destructive]:border-black group-[.destructive]:hover:border-black",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-none p-1 text-black transition-all",
      "hover:rotate-90 hover:scale-125",
      "group-[.destructive]:text-white group-[.destructive]:hover:text-white",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-5 w-5 stroke-[3px]" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-base pl-8 font-black uppercase tracking-wider", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm pl-8 font-bold opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}

