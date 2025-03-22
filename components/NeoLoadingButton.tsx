"use client"

import React, { useState } from "react"
import { TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface NeoLoadingButtonProps {
  onClick: () => Promise<void> | void
  children: React.ReactNode
  icon?: React.ReactNode
  loadingText?: string
  className?: string
}

export const NeoLoadingButton: React.FC<NeoLoadingButtonProps> = ({
  onClick,
  children,
  icon = <TrendingUp size={20} />,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleClick = async () => {
    setIsLoading(true)
    setProgress(0)
    
    // Start progress animation
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + Math.random() * 15
        return newProgress > 90 ? 90 : newProgress
      })
    }, 200)
    
    try {
      // Execute the actual onClick function
      await onClick()
      // Complete the progress bar
      setProgress(100)
      
      // Wait a moment to show 100% before resetting
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error("Error:", error)
      setIsLoading(false)
    } finally {
      clearInterval(interval)
    }
  }

  const baseClassName = "px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
  
  return (
    <AnimatePresence mode="wait">
      {!isLoading ? (
        <motion.button
          key="default-button"
          className={`${baseClassName} ${className}`}
          onClick={handleClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {icon}
          {children}
        </motion.button>
      ) : (
        <motion.button
          key="loading-button"
          className={`${baseClassName} ${className}`}
          disabled={true}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-full flex items-center">
            <div className="relative h-2 bg-white border border-black overflow-hidden flex-grow mr-2">
              <motion.div
                className="absolute top-0 left-0 h-full bg-black"
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center space-x-1">
              {["W", "F", "I"].map((letter, index) => (
                <motion.div
                  key={letter}
                  className="bg-black text-white font-mono font-bold px-1 text-xs leading-none"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 0.5,
                    delay: index * 0.2,
                  }}
                >
                  {letter}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  )
}