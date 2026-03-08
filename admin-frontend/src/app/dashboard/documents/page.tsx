'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { parseApiError } from '@/lib/utils/errors';
import { formatBytes, formatDateTime } from '@/lib/utils';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  X,
  Trash2,
  Download,
  MoreVertical,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: number;
  filename: string;
  file_size: number;
  file_type: string;
  status: string;
  user_email: string;
  user_id: number;
  created_at: string;
  chunk_count?: number;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments(currentPage);
  }, [currentPage, searchQuery, statusFilter, typeFilter]);

  const fetchDocuments = async (page: number = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        page_size: pageSize,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (typeFilter !== 'all') {
        params.file_type = typeFilter;
      }

      const response = await apiClient.get('/documents', { params });

      const { items = [], total: totalCount = 0 } = response.data;
      setDocuments(items);
      setTotal(totalCount);
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

  const handleDeleteDocument = async (docId: number, filename: string) => {
    if (!confirm(`Are you sure you want to delete document "${filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/documents/${docId}`);

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      fetchDocuments(currentPage);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground mt-1">
              {total} {total === 1 ? 'document' : 'documents'} total
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchDocuments(currentPage)}>
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
                    placeholder="Search by filename or user..."
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="w-full md:w-[180px]">
                <label htmlFor="type-filter" className="mb-1 block text-sm font-medium">
                  Type
                </label>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="txt">Text</SelectItem>
                    <SelectItem value="docx">Word</SelectItem>
                    <SelectItem value="md">Markdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card className="border-0 shadow-sm p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No documents found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="border-0 shadow-sm">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{doc.filename}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatBytes(doc.file_size)}</span>
                        <span>{doc.file_type.toUpperCase()}</span>
                        <span>{doc.user_email}</span>
                        {doc.chunk_count && <span>{doc.chunk_count} chunks</span>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(doc.created_at)}
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
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && documents.length > 0 && totalPages > 1 && (
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
