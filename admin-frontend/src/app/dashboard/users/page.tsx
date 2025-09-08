'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useAuthStore } from '@/lib/store/auth-store';
import { useUsers } from '@/hooks/useUsers';
import type { User } from '@/types/user';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Search, X, Shield, ShieldOff, Trash2, MoreVertical, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE = 20;
const columnHelper = createColumnHelper<User>();

export default function UsersPage() {
  const { admin: currentAdmin } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { users, total, totalPages, loading, fetchUsers, toggleAdmin, toggleActive, deleteUser } =
    useUsers({ search, roleFilter, statusFilter, page, pageSize: PAGE_SIZE });

  const columns = [
    columnHelper.accessor('username', {
      header: 'User',
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-900 dark:text-slate-100">{row.original.username}</span>
            {row.original.is_admin && (
              <Badge variant="info" className="gap-1 text-[10px] px-1.5 py-0">
                <Shield className="h-2.5 w-2.5" />
                Admin
              </Badge>
            )}
            {!row.original.is_active && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Inactive</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{row.original.email}</div>
        </div>
      ),
    }),
    columnHelper.accessor('created_at', {
      header: 'Joined',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(getValue()), { addSuffix: true })}
        </span>
      ),
    }),
    columnHelper.accessor('last_login', {
      header: 'Last login',
      cell: ({ getValue }) => {
        const v = getValue();
        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {v ? formatDistanceToNow(new Date(v), { addSuffix: true }) : '—'}
          </span>
        );
      },
    }),
    columnHelper.accessor('document_count', {
      header: 'Docs',
      cell: ({ getValue }) => (
        <span className="font-medium tabular-nums">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('conversation_count', {
      header: 'Convos',
      cell: ({ getValue }) => (
        <span className="font-medium tabular-nums">{getValue()}</span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === currentAdmin?.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => toggleAdmin(user.id, user.is_admin)}
                disabled={isSelf}
              >
                {user.is_admin ? (
                  <><ShieldOff className="mr-2 h-4 w-4" />Remove Admin</>
                ) : (
                  <><Shield className="mr-2 h-4 w-4" />Make Admin</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleActive(user.id, user.is_active)}
                disabled={isSelf}
              >
                {user.is_active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteUser(user.id, user.email)}
                disabled={isSelf}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {loading ? 'Loading…' : `${total} ${total === 1 ? 'user' : 'users'} total`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2 shrink-0">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm hover:translate-y-0 hover:shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="user-search" className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="user-search"
                    placeholder="Email or username…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9 h-9"
                  />
                  {search && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setSearch('')}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</label>
                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All roles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-[160px]">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-sm overflow-hidden hover:translate-y-0 hover:shadow-sm">
          {loading ? (
            <div className="space-y-0">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-0">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800 ml-auto" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300">No users found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Users will appear here once they sign up'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      {hg.headers.map((header) => (
                        <TableHead key={header.id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <PaginationInfo currentPage={page} pageSize={PAGE_SIZE} total={total} />
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
