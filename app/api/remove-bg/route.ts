import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json({ error: '请上传图片', code: 'MISSING_FILE' }, { status: 400 })
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '图片不能超过 10MB', code: 'FILE_TOO_LARGE' }, { status: 400 })
    }

    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: '服务未配置', code: 'SERVER_ERROR' }, { status: 500 })
    }

    const body = new FormData()
    body.append('image_file', imageFile)
    body.append('size', 'auto')

    const resp = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body,
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({})) as { errors?: { title: string }[] }
      const msg = err?.errors?.[0]?.title || 'Remove.bg 请求失败'
      if (resp.status === 402) {
        return NextResponse.json({ error: 'API 额度已用完', code: 'RATE_LIMIT' }, { status: 402 })
      }
      return NextResponse.json({ error: msg, code: 'API_ERROR' }, { status: resp.status })
    }

    const resultBuffer = await resp.arrayBuffer()
    return new NextResponse(resultBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="removed-bg.png"',
      },
    })
  } catch {
    return NextResponse.json({ error: '服务器内部错误', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
