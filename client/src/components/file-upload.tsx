import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFileIcon } from "@/lib/file-types";
import { apiRequest } from "@/lib/queryClient";
import { UploadedFile } from "@/pages/home";

interface FileUploadProps {
  uploadedFiles: UploadedFile[];
  onFilesUploaded: (files: UploadedFile[], sessionId: string) => void;
  onRemoveFile: (index: number) => void;
}

export function FileUpload({ uploadedFiles, onFilesUploaded, onRemoveFile }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      acceptedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await apiRequest("POST", "/api/upload", formData);
      const data = await response.json();

      onFilesUploaded(data.files, data.sessionId);
    } catch (error: any) {
      setUploadError(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'video/*': ['.mp4', '.avi'],
      'audio/*': ['.mp3', '.wav'],
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Upload className="text-primary mr-2" size={20} />
          Upload Files
        </h3>
        
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
            "hover:bg-muted/50",
            isDragActive 
              ? "border-primary bg-secondary/20 scale-102" 
              : "border-border bg-muted/30"
          )}
          data-testid="upload-zone"
        >
          <input {...getInputProps()} data-testid="file-input" />
          <Upload className={cn("mx-auto mb-4", isDragActive ? "text-primary" : "text-secondary")} size={48} />
          <p className="text-lg font-medium text-foreground mb-2">
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-muted-foreground mb-4">or click to browse files</p>
          <Button 
            variant="default" 
            disabled={isUploading}
            data-testid="button-select-files"
          >
            <FileText className="mr-2" size={16} />
            {isUploading ? "Uploading..." : "Select Files"}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Max file size: 50MB per file</p>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center">
            <AlertCircle className="text-destructive mr-2" size={16} />
            <span className="text-destructive text-sm">{uploadError}</span>
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-foreground flex items-center">
              <FileText className="mr-2 text-primary" size={16} />
              Uploaded Files 
              <Badge variant="secondary" className="ml-2" data-testid="text-file-count">
                {uploadedFiles.length}
              </Badge>
            </h4>
            
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-muted/50 rounded-md p-3 flex items-center justify-between animate-in slide-in-from-bottom-2"
                  data-testid={`card-file-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getFileIcon(file.extension)}</div>
                    <div>
                      <p className="font-medium text-foreground" data-testid={`text-filename-${index}`}>
                        {file.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-fileinfo-${index}`}>
                        {formatFileSize(file.size)} • {file.type.split('/')[0].toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(index)}
                    className="text-muted-foreground hover:text-destructive"
                    data-testid={`button-remove-${index}`}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
