'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, isAuthenticated, checkAuth, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      if (!useAuthStore.getState().isAuthenticated) {
        router.push('/auth/login');
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (!isAuthenticated || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  const initials = (admin.full_name || admin.username || admin.email)
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-white dark:bg-slate-900
          border-r border-slate-100 dark:border-slate-800
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">DocuLume</p>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="shrink-0 p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{admin.full_name || admin.username}</p>
              <p className="text-[11px] text-muted-foreground truncate">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">DocuLume Admin</span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
