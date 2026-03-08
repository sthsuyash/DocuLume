"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api/client";

interface FileDropzoneProps {
  onUploadComplete?: () => void;
}

interface UploadStatus {
  name: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function FileDropzone({ onUploadComplete }: FileDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<UploadStatus[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);

      // Initialize status for all files
      const initialStatuses: UploadStatus[] = acceptedFiles.map(file => ({
        name: file.name,
        status: 'uploading',
        progress: 0
      }));
      setFileStatuses(initialStatuses);

      // Upload files in parallel (or sequentially if you prefer)
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
          // Simulate progress
          const interval = setInterval(() => {
            setFileStatuses(prev => {
              const updated = [...prev];
              if (updated[index].status === 'uploading') {
                updated[index].progress = Math.min(updated[index].progress + 10, 90);
              }
              return updated;
            });
          }, 200);

          await apiClient.post("/documents/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          clearInterval(interval);

          setFileStatuses(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: 'success', progress: 100 };
            return updated;
          });

          return { success: true, name: file.name };
        } catch (error: any) {
          setFileStatuses(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              status: 'error',
              progress: 0,
              error: error.response?.data?.detail || "Upload failed"
            };
            return updated;
          });

          return { success: false, name: file.name, error: error.response?.data?.detail };
        }
      });

      const results = await Promise.all(uploadPromises);

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `${successCount} file(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
        onUploadComplete?.();
      }

      if (errorCount === acceptedFiles.length) {
        toast({
          title: "Error",
          description: "All uploads failed",
          variant: "destructive",
        });
      }

      setTimeout(() => {
        setUploading(false);
        setFileStatuses([]);
      }, 3000);
    },
    [toast, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "text/plain": [".txt"],
        "text/markdown": [".md"],
      },
      maxFiles: 10,
      disabled: uploading,
    });

  return (
    <Card
      {...getRootProps()}
      className={`
        relative cursor-pointer border-2 border-dashed p-12 text-center transition-all
        ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary"}
        ${uploading ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-primary/10 p-6">
          <Upload className="h-12 w-12 text-primary" />
        </div>

        {uploading && fileStatuses.length > 0 ? (
          <div className="w-full space-y-3">
            <p className="text-lg font-medium">Uploading {fileStatuses.length} file(s)...</p>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {fileStatuses.map((fileStatus, index) => (
                <div key={index} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <File className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{fileStatus.name}</span>
                    </div>
                    {fileStatus.status === 'uploading' && (
                      <span className="text-xs text-muted-foreground">{fileStatus.progress}%</span>
                    )}
                    {fileStatus.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    {fileStatus.status === 'error' && (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  {fileStatus.status === 'uploading' && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${fileStatus.progress}%` }}
                      />
                    </div>
                  )}
                  {fileStatus.status === 'error' && fileStatus.error && (
                    <p className="mt-1 text-xs text-destructive">{fileStatus.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className="text-lg font-medium">
                {isDragActive
                  ? "Drop your files here"
                  : "Drag & drop files here, or click to select"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Supports PDF, TXT, MD (max 50MB per file, up to 10 files)
              </p>
            </div>

            {acceptedFiles.length > 0 && !uploading && (
              <div className="space-y-2">
                {acceptedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
