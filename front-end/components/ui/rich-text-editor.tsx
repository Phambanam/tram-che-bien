"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  // Handle markdown editor change
  const handleChange = (val?: string) => {
    onChange(val || "")
  }

  return (
    <div className={className} data-color-mode="light">
      <MDEditor
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        height={200}
        visibleDragBar={false}
        textareaProps={{
          placeholder: placeholder || "Nhập nội dung bài viết...",
          style: {
            fontSize: 14,
            lineHeight: 1.6,
          }
        }}
      />
    </div>
  )
} 