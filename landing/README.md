# DocuLume Landing Site

Marketing and conversion-oriented web property for DocuLume, built as a separate Next.js application.

## Scope

The landing site provides:

- Product positioning and public-facing messaging.
- Primary call-to-action paths into the main application.
- Newsletter and contact collection workflows.
- Public policy and informational pages.

## Technology Profile

- Framework: Next.js 15
- Language: TypeScript
- Styling: Tailwind CSS

## Runtime Requirements

- Node.js 18+
- pnpm

## Local Development

```bash
pnpm install
pnpm run dev
```

Default local URL: <http://localhost:3002>

## Deployment

For production deployment, publish through your selected platform (for example Vercel) and apply environment variables in the target environment.

## Newsletter Integration

Primary provider: Brevo.

1. Create a Brevo account and contact list.
2. Copy `.env.example` to `.env.local`.
3. Configure:

```bash
BREVO_API_KEY=your_brevo_api_key
BREVO_LIST_ID=your_brevo_list_id
```

Optional webhook fallback:

```bash
NEWSLETTER_WEBHOOK_URL=https://your-provider-webhook-endpoint
NEWSLETTER_WEBHOOK_TOKEN=optional_bearer_token
```

Submission flow: `/api/newsletter` attempts Brevo first, then webhook fallback when configured.

## Application Redirect Configuration

Set destination URL for product CTA actions:

```bash
NEXT_PUBLIC_FE_URL=https://app.your-domain.com
```

## Contact Page Configuration

Optional contact addresses displayed on `/contact`:

```bash
NEXT_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
NEXT_PUBLIC_SALES_EMAIL=sales@your-domain.com
NEXT_PUBLIC_SECURITY_EMAIL=security@your-domain.com
```

## Related Documentation

- [Root README](../README.md)
- [Documentation Hub](../docs/README.md)
- [Deployment Guide](../docs/guides/DEPLOYMENT.md)

## License

MIT License.
