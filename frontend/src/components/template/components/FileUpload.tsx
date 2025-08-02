'use client'

import React, { useState, useRef } from 'react'

interface FileWithId {
  id: string
  file: File
}

interface FileUploadProps {
  onFilesChange: (files: FileWithId[]) => void
  files: FileWithId[]
  className?: string
}

export function FileUpload({ onFilesChange, files, className = '' }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const newFiles = droppedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file
    }))

    onFilesChange([...files, ...newFiles])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const newFiles = selectedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file
      }))

      onFilesChange([...files, ...newFiles])
    }
  }

  const removeFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id))
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`border-2 w-full border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragOver
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary hover:bg-muted'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="text-6xl text-muted-foreground">📁</div>
          <div>
            <p className="text-lg font-medium text-foreground">
              拖曳檔案到此處或點擊上傳
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              支援多個檔案上傳
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-medium text-foreground">待上傳檔案：</h3>
          {files.map((fileWithId) => (
            <div
              key={fileWithId.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-medium text-foreground">{fileWithId.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(fileWithId.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(fileWithId.id)}
                className="text-destructive hover:text-destructive/80 font-bold text-lg"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}