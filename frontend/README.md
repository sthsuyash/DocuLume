# DocuLume Frontend

Frontend web application for DocuLume, implemented with Next.js 14, TypeScript, and a component-driven UI architecture.

## Scope

The frontend provides:

- User authentication and session handling.
- Document upload and document management workflows.
- Conversational Q&A interface over indexed documents.
- Dashboard and operational user flows for day-to-day usage.

## Technology Profile

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI primitives: shadcn/ui (Radix)
- State management: Zustand
- API client: Axios

## Runtime Requirements

- Node.js 18+
- pnpm
- Backend API reachable at `http://localhost:8000`

## Local Development

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local

# Start development server
pnpm run dev
```

Default local URL: <http://localhost:3000>

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

## Build and Validation Commands

```bash
pnpm run dev
pnpm run build
pnpm run start
pnpm run lint
pnpm run format
```

## Application Routes

- `/` - application entry
- `/auth/login` - sign-in
- `/auth/register` - user registration
- `/auth/callback` - OAuth callback processing
- `/dashboard` - document and workspace dashboard
- `/chat` - conversational interface

## Project Structure

```text
frontend/
├── src/
│   ├── app/              # Next.js app routes
│   ├── components/       # shared UI and feature components
│   ├── lib/              # api clients, state, and utilities
│   └── test/             # frontend test assets
├── components/           # top-level shared components
├── e2e/                  # end-to-end tests
└── package.json
```

## Deployment

### Container Deployment

```bash
docker build -t doculume-frontend .
docker run -p 3000:3000 doculume-frontend
```

### Platform Deployment

For managed frontend hosting (for example Vercel), run a production build and configure required environment variables before release.

## Related Documentation

- [Root README](../README.md)
- [Documentation Hub](../docs/README.md)
- [Setup Guide](../docs/guides/SETUP.md)
- [Backend Setup](../docs/backend/SETUP.md)
- [Deployment Guide](../docs/guides/DEPLOYMENT.md)

## License

MIT License.
