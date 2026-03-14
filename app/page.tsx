'use client'

import { useCallback, useRef, useState } from 'react'

type State = 'idle' | 'loading' | 'done' | 'error'

export default function Home() {
  const [state, setState] = useState<State>('idle')
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setErrorMsg('仅支持 JPG、PNG、WebP 格式')
      setState('error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('图片不能超过 10MB')
      setState('error')
      return
    }

    setOriginalUrl(URL.createObjectURL(file))
    setResultUrl(null)
    setResultBlob(null)
    setState('loading')

    try {
      const fd = new FormData()
      fd.append('image', file)
      const resp = await fetch('/api/remove-bg', { method: 'POST', body: fd })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error || '处理失败，请重试')
      }

      const blob = await resp.blob()
      setResultBlob(blob)
      setResultUrl(URL.createObjectURL(blob))
      setState('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '未知错误')
      setState('error')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files).find(f => f.type.startsWith('image/'))
    if (file) processFile(file)
  }, [processFile])

  const handleDownload = () => {
    if (!resultBlob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(resultBlob)
    a.download = 'removed-bg.png'
    a.click()
  }

  const reset = () => {
    setState('idle')
    setOriginalUrl(null)
    setResultUrl(null)
    setResultBlob(null)
    setErrorMsg('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col min-h-screen" onPaste={handlePaste}>
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm font-bold">✂</div>
        <h1 className="font-semibold text-lg">Image Background Remover</h1>
        <span className="text-xs bg-violet-900/60 text-violet-300 px-2 py-0.5 rounded-full border border-violet-700/50">AI 抠图</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            一键去除图片背景
          </h2>
          <p className="text-neutral-400">上传图片，秒级处理，下载透明 PNG · 支持拖拽、粘贴上传</p>
        </div>

        <div className="w-full max-w-3xl">
          {/* Upload Zone */}
          {state === 'idle' || state === 'error' ? (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-violet-500 bg-violet-950/30'
                    : 'border-neutral-700 bg-neutral-900 hover:border-violet-600 hover:bg-neutral-800/50'
                  }`}
              >
                <div className="text-5xl mb-4">🖼️</div>
                <p className="text-neutral-300 mb-1">
                  <span className="text-violet-400 font-medium">点击上传</span> 或拖拽图片到此处
                </p>
                <p className="text-neutral-500 text-sm">支持 JPG、PNG、WebP · 最大 10MB · 也可直接粘贴</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />
              </div>

              {state === 'error' && (
                <div className="mt-4 bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-red-300 text-sm">
                  ⚠ {errorMsg}
                </div>
              )}
            </>
          ) : null}

          {/* Loading */}
          {state === 'loading' && (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-3 border-neutral-700 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
              <p className="text-neutral-400">正在处理，请稍候...</p>
              {originalUrl && (
                <img src={originalUrl} alt="原图" className="mt-6 max-h-40 mx-auto rounded-lg opacity-40 object-contain" />
              )}
            </div>
          )}

          {/* Result */}
          {state === 'done' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800">
                  <div className="px-4 py-2.5 text-xs text-neutral-500 border-b border-neutral-800">原图</div>
                  <img src={originalUrl!} alt="原图" className="w-full object-contain max-h-72" />
                </div>
                <div className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800">
                  <div className="px-4 py-2.5 text-xs text-neutral-500 border-b border-neutral-800">去背景结果</div>
                  <div
                    className="w-full max-h-72 flex items-center justify-center"
                    style={{ background: 'repeating-conic-gradient(#2a2a2a 0% 25%, #222 0% 50%) 0 0 / 20px 20px' }}
                  >
                    <img src={resultUrl!} alt="结果" className="w-full object-contain max-h-72" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={handleDownload}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  ⬇ 下载 PNG
                </button>
                <button
                  onClick={reset}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium px-6 py-2.5 rounded-xl border border-neutral-700 transition-colors"
                >
                  重新上传
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-neutral-600 text-xs border-t border-neutral-900">
        Powered by <a href="https://www.remove.bg" className="text-violet-700 hover:text-violet-500">Remove.bg</a> · Image Background Remover
      </footer>
    </div>
  )
}
