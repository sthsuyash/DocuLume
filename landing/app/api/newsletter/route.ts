import { NextResponse } from 'next/server'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function subscribeViaBrevo(email: string) {
  const apiKey = process.env.BREVO_API_KEY
  const listIdRaw = process.env.BREVO_LIST_ID

  if (!apiKey || !listIdRaw) {
    return { configured: false as const }
  }

  const listId = Number.parseInt(listIdRaw, 10)

  if (Number.isNaN(listId)) {
    return { configured: true as const, ok: false as const }
  }

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
      attributes: {
        SOURCE: 'doculume-landing',
      },
    }),
  })

  if (response.ok) {
    return { configured: true as const, ok: true as const }
  }

  return { configured: true as const, ok: false as const }
}

async function subscribeViaWebhook(email: string) {
  const webhookUrl = process.env.NEWSLETTER_WEBHOOK_URL
  const webhookToken = process.env.NEWSLETTER_WEBHOOK_TOKEN

  if (!webhookUrl) {
    return { configured: false as const }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
    },
    body: JSON.stringify({
      email,
      source: 'doculume-landing',
      subscribedAt: new Date().toISOString(),
    }),
  })

  return { configured: true as const, ok: response.ok }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string }
    const email = (body.email ?? '').trim().toLowerCase()

    if (!email || !emailPattern.test(email)) {
      return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 })
    }

    const brevoResult = await subscribeViaBrevo(email)

    if (brevoResult.configured && brevoResult.ok) {
      return NextResponse.json({ message: 'Thanks! You are now subscribed.' })
    }

    const webhookResult = await subscribeViaWebhook(email)

    if (webhookResult.configured && webhookResult.ok) {
      return NextResponse.json({ message: 'Thanks! You are now subscribed.' })
    }

    if (brevoResult.configured || webhookResult.configured) {
      return NextResponse.json({ message: 'Unable to subscribe right now. Please retry shortly.' }, { status: 502 })
    }

    return NextResponse.json(
      { message: 'Subscription endpoint is not configured yet. Please try again later.' },
      { status: 503 },
    )
  } catch {
    return NextResponse.json({ message: 'Unexpected error during subscription. Please try again.' }, { status: 500 })
  }
}
