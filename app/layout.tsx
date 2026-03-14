import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Image Background Remover',
  description: '一键去除图片背景，下载透明 PNG',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${geist.className} bg-neutral-950 text-neutral-100 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
