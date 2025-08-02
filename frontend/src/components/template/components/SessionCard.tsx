'use client'

import React from 'react'

interface SessionCardProps {
  sessionId: string
  filesCount: number
  status: 'processing' | 'completed' | 'error'
  className?: string
}

export function SessionCard({ sessionId, filesCount, status, className = '' }: SessionCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-chart-1'
      case 'completed':
        return 'text-chart-2'
      case 'error':
        return 'text-destructive'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return '處理中'
      case 'completed':
        return '已完成'
      case 'error':
        return '發生錯誤'
      default:
        return '未知狀態'
    }
  }

  return (
    <div className={`
      bg-card rounded-lg p-6 border border-border shadow-lg
      hover:shadow-xl transition-shadow duration-200
      ${className}
    `}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-card-foreground">Session 詳情</h2>
          <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
            {status === 'processing' && (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            )}
            <span className="font-medium">{getStatusText()}</span>
          </div>
        </div>
        
        <div className="bg-muted rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Session ID</p>
              <p className="font-mono text-sm bg-background px-3 py-2 rounded border border-border break-all">
                {sessionId}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">上傳檔案數量</p>
              <p className="font-medium text-lg">
                {filesCount} 個檔案
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button className="
            bg-primary text-primary-foreground px-4 py-2 rounded-lg
            hover:bg-primary/90
            transition-all duration-200
          ">
            下載報告
          </button>
          <button className="
            bg-transparent text-foreground px-4 py-2 rounded-lg border-2 border-border
            hover:border-primary hover:text-primary
            transition-all duration-200
          ">
            查詢內容
          </button>
        </div>
      </div>
    </div>
  )
}