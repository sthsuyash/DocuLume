'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import apiClient from '@/lib/api/client';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { parseApiError } from '@/lib/utils/errors';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  X,
  Shield,
  ShieldOff,
  Mail,
  Calendar,
  UserCog,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  document_count: number;
  conversation_count: number;
}

export default function UsersPage() {
  const { admin: currentAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        page_size: pageSize,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (roleFilter === 'admin') {
        params.is_admin = true;
      } else if (roleFilter === 'user') {
        params.is_admin = false;
      }

      if (statusFilter === 'active') {
        params.is_active = true;
      } else if (statusFilter === 'inactive') {
        params.is_active = false;
      }

      const response = await apiClient.get('/admin/users', { params });

      const { items = [], total: totalCount = 0, page: currentPageNum = 1 } = response.data;
      setUsers(items);
      setTotal(totalCount);
      setCurrentPage(currentPageNum);
      setTotalPages(Math.ceil(totalCount / pageSize));
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: number, currentIsAdmin: boolean) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, {
        is_admin: !currentIsAdmin,
      });

      toast({
        title: 'Success',
        description: `User ${currentIsAdmin ? 'removed from' : 'promoted to'} admin`,
      });

      fetchUsers(currentPage);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (userId: number, currentIsActive: boolean) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, {
        is_active: !currentIsActive,
      });

      toast({
        title: 'Success',
        description: `User ${currentIsActive ? 'deactivated' : 'activated'}`,
      });

      fetchUsers(currentPage);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/users/${userId}`);

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      fetchUsers(currentPage);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              {total} {total === 1 ? 'user' : 'users'} total
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchUsers(currentPage)}>
            Refresh
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Search Input */}
              <div className="flex-1">
                <label htmlFor="search" className="mb-1 block text-sm font-medium">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by email or username..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Role Filter */}
              <div className="w-full md:w-[180px]">
                <label htmlFor="role-filter" className="mb-1 block text-sm font-medium">
                  Role
                </label>
                <Select
                  value={roleFilter}
                  onValueChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="role-filter">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-[180px]">
                <label htmlFor="status-filter" className="mb-1 block text-sm font-medium">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
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

        {/* Users List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card className="border-0 shadow-sm p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No users found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="border-0 shadow-sm">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UserCog className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{user.username}</h3>
                        {user.is_admin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                        {!user.is_active && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            <ShieldOff className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>{user.document_count} documents</span>
                        <span>{user.conversation_count} conversations</span>
                        {user.last_login && (
                          <span>
                            Last login: {formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        disabled={user.id === currentAdmin?.id}
                      >
                        {user.is_admin ? (
                          <>
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Remove Admin
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Make Admin
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        disabled={user.id === currentAdmin?.id}
                      >
                        {user.is_active ? 'Deactivate User' : 'Activate User'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={user.id === currentAdmin?.id}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
