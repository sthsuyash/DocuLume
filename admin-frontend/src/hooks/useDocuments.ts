'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api/client';
import { parseApiError } from '@/lib/utils/errors';
import { useToast } from '@/components/ui/use-toast';
import type { AdminDocument, UseDocumentsParams } from '@/types/document';

export function useDocuments({ search, statusFilter, typeFilter, page, pageSize }: UseDocumentsParams) {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, page_size: pageSize };

      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.file_type = typeFilter;

      const res = await apiClient.get('/admin/documents', { params });
      const { items = [], total: t = 0 } = res.data;
      setDocuments(items);
      setTotal(t);
      setTotalPages(Math.ceil(t / pageSize));
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, page, pageSize]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const deleteDocument = async (docId: number, filename: string): Promise<boolean> => {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return false;
    try {
      await apiClient.delete(`/admin/documents/${docId}`);
      toast({ title: 'Success', description: 'Document deleted' });
      fetchDocuments();
      return true;
    } catch (error: any) {
      const e = parseApiError(error);
      toast({ title: e.title, description: e.message, variant: 'destructive' });
      return false;
    }
  };

  return { documents, total, totalPages, loading, fetchDocuments, deleteDocument };
}
