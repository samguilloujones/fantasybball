"use client"

import type React from "react"

interface ClickablePlayerProps {
  playerName: string
  onPlayerClick: (playerName: string) => void
  className?: string
  children?: React.ReactNode
}

export default function ClickablePlayer({ playerName, onPlayerClick, className = "", children }: ClickablePlayerProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onPlayerClick(playerName)
  }

  return (
    <button
      onClick={handleClick}
      className={`text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors ${className}`}
    >
      {children || playerName}
    </button>
  )
}
