"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface NeoProgressIndicatorProps {
  isLoading: boolean
  message?: string
}

export const NeoProgressIndicator: React.FC<NeoProgressIndicatorProps> = ({ isLoading, message = "Loading..." }) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + Math.random() * 15
          return newProgress > 90 ? 90 : newProgress
        })
      }, 200)

      return () => clearInterval(interval)
    } else {
      setProgress(100)
    }
  }, [isLoading])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed inset-0 flex items-center justify-center z-50"
        >
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
            <h2 className="text-3xl font-bold mb-4 font-mono">{message}</h2>
            <div className="relative h-8 bg-gray-200 border-2 border-black overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-[#93B8F3]"
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono font-bold text-lg">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              {["WAIT", "FOR", "IT"].map((word, index) => (
                <motion.div
                  key={word}
                  className="bg-black text-white font-mono font-bold p-2"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 0.5,
                    delay: index * 0.2,
                  }}
                >
                  {word}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

