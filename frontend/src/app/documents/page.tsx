"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import apiClient from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropzone } from "@/components/file-dropzone";
import { DocumentSkeleton } from "@/components/loading-skeleton";
import { ArrowLeft, FileText, Trash2, Calendar, HardDrive, Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { parseApiError, formatValidationErrors } from "@/lib/utils/errors";

interface Document {
  id: number;
  original_filename: string;
  file_size: number;
  file_type: string;
  status: string;
  page_count: number;
  chunk_count: number;
  created_at: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at_desc");
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchDocuments(currentPage);
  }, [isAuthenticated, router, currentPage, searchQuery, statusFilter, fileTypeFilter, sortBy]);

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

      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (fileTypeFilter && fileTypeFilter !== "all") {
        params.file_type = fileTypeFilter;
      }

      if (sortBy) {
        const [field, order] = sortBy.split("_");
        params.sort_by = field;
        params.sort_order = order === "desc" ? "desc" : "asc";
      }

      const response = await apiClient.get("/documents/", { params });

      // Backend now returns paginated response: { items, total, page, page_size }
      const { items = [], total: totalCount = 0, page: currentPageNum = 1 } = response.data;
      setDocuments(items);
      setTotal(totalCount);
      setCurrentPage(currentPageNum);
      setTotalPages(Math.ceil(totalCount / pageSize));
    } catch (error: any) {
      const parsedError = parseApiError(error);
      const validationErrors = formatValidationErrors(parsedError.validationErrors);

      toast({
        title: parsedError.title,
        description: validationErrors.length > 0
          ? `${parsedError.message}\n${validationErrors.join("\n")}`
          : parsedError.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await apiClient.delete(`/documents/${id}`);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      // Stay on current page if there are still documents, otherwise go to previous page
      const remainingDocs = total - 1;
      const newTotalPages = Math.ceil(remainingDocs / pageSize);
      const newPage = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;
      setCurrentPage(newPage);
      fetchDocuments(newPage);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedDocs.length} selected document(s)?`)) return;

    try {
      await apiClient.post("/documents/bulk-delete", {
        document_ids: selectedDocs,
      });
      toast({
        title: "Success",
        description: `${selectedDocs.length} document(s) deleted successfully`,
      });
      setSelectedDocs([]);
      setCurrentPage(1);
      fetchDocuments(1);
    } catch (error: any) {
      const parsedError = parseApiError(error);
      toast({
        title: parsedError.title,
        description: parsedError.message,
        variant: "destructive",
      });
    }
  };

  const toggleDocSelection = (id: number) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map((doc) => doc.id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md px-4 py-3 supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">My Documents</h1>
          </div>
          <div className="flex items-center gap-4">
            {selectedDocs.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="rounded-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {selectedDocs.length}
              </Button>
            )}
            <div className="hidden text-sm font-medium text-muted-foreground sm:block">
              {total} {total === 1 ? "document" : "documents"}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-4 md:p-8">
        <div className="fade-up mb-8 md:mb-12">
          <FileDropzone
            onUploadComplete={() => {
              setCurrentPage(1);
              fetchDocuments(1);
            }}
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
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
                  placeholder="Search by filename..."
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
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
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

            {/* File Type Filter */}
            <div className="w-full md:w-[180px]">
              <label htmlFor="type-filter" className="mb-1 block text-sm font-medium">
                File Type
              </label>
              <Select
                value={fileTypeFilter}
                onValueChange={(value) => {
                  setFileTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value=".pdf">PDF</SelectItem>
                  <SelectItem value=".txt">Text</SelectItem>
                  <SelectItem value=".docx">Word</SelectItem>
                  <SelectItem value=".md">Markdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="w-full md:w-[200px]">
              <label htmlFor="sort" className="mb-1 block text-sm font-medium">
                Sort By
              </label>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at_desc">Newest first</SelectItem>
                  <SelectItem value="created_at_asc">Oldest first</SelectItem>
                  <SelectItem value="original_filename_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="original_filename_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="file_size_desc">Largest first</SelectItem>
                  <SelectItem value="file_size_asc">Smallest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || statusFilter !== "all" || fileTypeFilter !== "all" || sortBy !== "created_at_desc") && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Active filters:</span>
              {searchQuery && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="h-7"
                >
                  Search: "{searchQuery}"
                  <X className="ml-2 h-3 w-3" />
                </Button>
              )}
              {statusFilter !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="h-7"
                >
                  Status: {statusFilter}
                  <X className="ml-2 h-3 w-3" />
                </Button>
              )}
              {fileTypeFilter !== "all" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFileTypeFilter("all")}
                  className="h-7"
                >
                  Type: {fileTypeFilter}
                  <X className="ml-2 h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setFileTypeFilter("all");
                  setSortBy("created_at_desc");
                }}
                className="h-7 text-muted-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Documents</h2>
            {documents.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedDocs.length === documents.length && documents.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="cursor-pointer"
                />
                <label
                  htmlFor="select-all"
                  className="cursor-pointer text-sm text-muted-foreground"
                >
                  Select All
                </label>
              </div>
            )}
          </div>

          {loading ? (
            <DocumentSkeleton />
          ) : documents.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No documents yet. Upload one to get started!
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc, index) => (
                <Card key={doc.id} className="fade-up group hover:shadow-lg" style={{ animationDelay: `${index * 30}ms` }}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Checkbox
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={() => toggleDocSelection(doc.id)}
                          className="cursor-pointer"
                        />
                        <div className="rounded-lg bg-primary/10 p-2.5 transition-transform group-hover:scale-110">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="truncate text-sm">
                            {doc.original_filename}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                doc.status === "completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc.id)}
                        className="shrink-0 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <HardDrive className="h-4 w-4 shrink-0" />
                        <span className="truncate">{formatFileSize(doc.file_size)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span className="truncate">{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {doc.page_count} {doc.page_count === 1 ? "page" : "pages"}
                      </div>
                      <div className="text-muted-foreground">{doc.chunk_count} chunks</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div className="mt-8 space-y-4">
              <PaginationInfo
                currentPage={currentPage}
                pageSize={pageSize}
                total={total}
                className="text-center"
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setSelectedDocs([]);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
