import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).password !== 'string'
  ) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const { password } = body as { password: string }
  const correct = process.env.ADMIN_PASSWORD

  if (!correct) {
    console.error('ADMIN_PASSWORD env var is not set')
    return NextResponse.json({ success: false }, { status: 500 })
  }

  if (password === correct) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false }, { status: 401 })
}
