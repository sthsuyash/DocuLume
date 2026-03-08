# DocuLume Admin Panel

> Secure admin panel for managing the DocuLume platform

## Features

- 🔒 **Secure Access**: Admin-only authentication with strict role verification
- 📊 **System Overview**: Real-time statistics and recent activity monitoring
- 👥 **User Management**: Full CRUD operations for user accounts
- 📄 **Document Management**: View and manage all documents
- 📈 **Analytics Dashboard**: Detailed usage trends and insights
- 🎨 **Modern UI**: Clean, professional design using Poppins font and shadcn/ui
- 🍪 **httpOnly Cookies**: Maximum security with XSS and CSRF protection

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts
- **Font**: Poppins

## Getting Started

### Prerequisites

- Node.js 18+ (or pnpm/bun)
- Backend API running at `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Update environment variables
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Start development server
npm run dev
```

The admin panel will be available at `http://localhost:3001`

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Development

```bash
# Start dev server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

## Project Structure

```
admin-frontend/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   └── login/          # Admin login page
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Main dashboard
│   │   │   ├── users/          # User management
│   │   │   ├── documents/      # Document management
│   │   │   ├── analytics/      # Analytics dashboard
│   │   │   └── settings/       # System settings
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── admin-layout.tsx    # Sidebar layout
│   │   └── ui/                 # shadcn components
│   └── lib/
│       ├── api/
│       │   └── client.ts       # Axios client with cookies
│       ├── store/
│       │   └── auth-store.ts   # Zustand auth state
│       └── utils/
│           └── errors.ts       # RFC 7807 error handling
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Security Features

### Authentication

- **Admin-Only Access**: Verifies `is_admin` or `is_superuser` on login
- **httpOnly Cookies**: Tokens stored in httpOnly cookies (not localStorage)
- **CSRF Protection**: CSRF token validation on all state-changing requests
- **Auto-Refresh**: Automatic token refresh keeps admins logged in

### Session Management

- Access token: 15 minutes
- Refresh token: 7 days
- Automatic logout on unauthorized access
- All actions logged for audit trail

### Network Security

- Cookies sent only over HTTPS in production
- SameSite=Lax prevents cross-site attacks
- Secure headers configured in `next.config.js`

## Pages

### Login (`/auth/login`)

- Clean, professional login form
- Admin role verification
- Security notice about audit logging

### Dashboard (`/dashboard`)

- System statistics (users, documents, conversations, storage)
- Recent activity feed
- Quick action cards

### User Management (`/dashboard/users`)

- List all users with search and filters
- Promote/demote admin status
- Activate/deactivate accounts
- Delete users
- View user statistics

### Analytics (`/dashboard/analytics`)

- Usage trends over time
- Top users by activity
- Document type distribution
- Export data as CSV/JSON

### Documents (`/dashboard/documents`)

- View all documents across users
- Filter by user, status, type
- Document details and metadata

### Settings (`/dashboard/settings`)

- System configuration
- Feature flags
- Integration settings

## Deployment

### Docker

```bash
# Build image
docker build -t doculume-admin .

# Run container
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=https://api.doculume.com/api/v1 \
  doculume-admin
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

### Subdomain Setup

Recommended deployment URLs:

- User App: `https://app.doculume.com`
- Admin Panel: `https://admin.doculume.com`
- API: `https://api.doculume.com`

## Design Guidelines

### Color Palette

- Primary: Blue (`#3B82F6`)
- Success: Green (`#10B981`)
- Warning: Orange (`#F59E0B`)
- Danger: Red (`#EF4444`)
- Background: Clean whites and light grays

### Typography

- Font Family: Poppins
- Headings: Semi-bold (600-700)
- Body: Regular (400)
- Monospace: System mono

### Spacing

- Consistent 8px grid system
- Generous padding for readability
- Clear visual hierarchy

## Best Practices

1. **Security First**: Always verify admin role, never expose sensitive data
2. **User Feedback**: Use toast notifications for all actions
3. **Error Handling**: Parse RFC 7807 errors and display user-friendly messages
4. **Loading States**: Show skeletons/spinners during data fetching
5. **Responsive Design**: Works on desktop, tablet, and mobile
6. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

## API Integration

All API calls use the configured `apiClient` from `@/lib/api/client`:

```typescript
import apiClient from '@/lib/api/client';

// Cookies sent automatically
const response = await apiClient.get('/admin/stats');

// CSRF token added automatically for mutations
await apiClient.post('/admin/users', data);
```

## Troubleshooting

### "Access Denied" on Login

- Ensure user has `is_admin: true` or `is_superuser: true`
- Check backend `/admin` endpoints are accessible

### Cookies Not Set

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS configuration allows credentials
- Ensure backend sets cookies properly

### 403 CSRF Errors

- Check CSRF token in cookies
- Verify `X-CSRF-Token` header is sent
- Ensure cookies and headers match

## License

MIT

## Support

For issues or questions:
- Backend API: See `backend/README.md`
- Security: See `HTTPONLY_COOKIE_SECURITY.md`
- General: See main `README.md`
