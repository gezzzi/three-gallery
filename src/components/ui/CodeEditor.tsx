'use client'

import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Pause, RotateCcw, Maximize2, Minimize2 } from 'lucide-react'

interface CodeEditorProps {
  initialCode?: string
  onChange?: (value: string) => void
  onRun?: (code: string) => void
  height?: string
  readOnly?: boolean
  showControls?: boolean
}

export default function CodeEditor({
  initialCode = '',
  onChange,
  onRun,
  height = '400px',
  readOnly = false,
  showControls = true
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [isRunning, setIsRunning] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const editorRef = useRef<unknown>(null)

  const handleEditorDidMount = (editor: unknown) => {
    editorRef.current = editor
  }

  const handleChange = (value: string | undefined) => {
    const newCode = value || ''
    setCode(newCode)
    onChange?.(newCode)
  }

  const handleRun = () => {
    if (onRun) {
      setIsRunning(true)
      onRun(code)
      setTimeout(() => setIsRunning(false), 1000)
    }
  }

  const handleReset = () => {
    setCode(initialCode)
    onChange?.(initialCode)
    if (onRun) {
      onRun(initialCode)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {showControls && (
        <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning || !onRun}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Run</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
      <Editor
        height={isFullscreen ? 'calc(100vh - 48px)' : height}
        defaultLanguage="javascript"
        value={code}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          }
        }}
      />
    </div>
  )
}