"use client"

import { useEffect, useRef } from "react"
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
  onInsertImage?: (position: number) => void
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  className,
  onInsertImage 
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null)

  // Handle markdown editor change
  const handleChange = (val?: string) => {
    onChange(val || "")
  }

  // Insert image at current cursor position
  const insertImageAtCursor = (imageUrl: string, imageName: string) => {
    const editor = editorRef.current?.editor
    if (!editor) return

    const cursor = editor.getCursor()
    const imageMarkdown = `![${imageName}](${imageUrl})\n`
    
    // Insert at cursor position
    editor.replaceRange(imageMarkdown, cursor)
    
    // Move cursor after inserted text
    const newCursor = {
      line: cursor.line + 1,
      ch: 0
    }
    editor.setCursor(newCursor)
    editor.focus()
    
    // Update the value
    const newValue = editor.getValue()
    onChange(newValue)
  }

  // Expose insertImageAtCursor method via ref
  useEffect(() => {
    if (editorRef.current && onInsertImage) {
      editorRef.current.insertImageAtCursor = insertImageAtCursor
    }
  }, [onInsertImage])

  return (
    <div className={className} data-color-mode="light">
      <MDEditor
        ref={editorRef}
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
        data-color-mode="light"
        preview="edit"
      />
    </div>
  )
} 