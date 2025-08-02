'use client'

import React from 'react'

interface SubmitButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export function SubmitButton({ 
  onClick, 
  loading = false, 
  disabled = false, 
  children, 
  className = '' 
}: SubmitButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium
        hover:bg-primary/90 hover:text-primary-foreground
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>處理中...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}