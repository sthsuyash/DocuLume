'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api/client';
import { parseApiError } from '@/lib/utils/errors';
import { useToast } from '@/components/ui/use-toast';
import type { User, UseUsersParams } from '@/types/user';

export function useUsers({ search, roleFilter, statusFilter, page, pageSize }: UseUsersParams) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, page_size: pageSize };

      if (search.trim()) params.search = search.trim();
      if (roleFilter === 'admin') params.is_admin = true;
      else if (roleFilter === 'user') params.is_admin = false;
      if (statusFilter === 'active') params.is_active = true;
      else if (statusFilter === 'inactive') params.is_active = false;

      const res = await apiClient.get('/admin/users', { params });
      const { items = [], total: t = 0 } = res.data;
      setUsers(items);
      setTotal(t);
      setTotalPages(Math.ceil(t / pageSize));
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, pageSize]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleAdmin = async (userId: number, currentIsAdmin: boolean) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, { is_admin: !currentIsAdmin });
      toast({ title: 'Success', description: `User ${currentIsAdmin ? 'removed from' : 'promoted to'} admin` });
      fetchUsers();
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (userId: number, currentIsActive: boolean) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, { is_active: !currentIsActive });
      toast({ title: 'Success', description: `User ${currentIsActive ? 'deactivated' : 'activated'}` });
      fetchUsers();
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: 'destructive' });
    }
  };

  const deleteUser = async (userId: number, userEmail: string): Promise<boolean> => {
    if (!confirm(`Delete user ${userEmail}? This cannot be undone.`)) return false;
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast({ title: 'Success', description: 'User deleted successfully' });
      fetchUsers();
      return true;
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: 'destructive' });
      return false;
    }
  };

  return { users, total, totalPages, loading, fetchUsers, toggleAdmin, toggleActive, deleteUser };
}
