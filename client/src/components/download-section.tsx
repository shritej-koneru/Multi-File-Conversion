import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileArchive, Shield } from "lucide-react";
import { ConversionJob } from "@/pages/home";

interface DownloadSectionProps {
  conversionJob: ConversionJob | null;
}

export function DownloadSection({ conversionJob }: DownloadSectionProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (downloadUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasCompletedConversion = conversionJob?.status === "completed" && conversionJob.downloadUrl;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Download className="text-primary mr-2" size={20} />
          Downloads
        </h3>

        {!hasCompletedConversion ? (
          <div className="text-center py-8" data-testid="download-empty-state">
            <Download className="mx-auto text-muted-foreground/50 mb-3" size={48} />
            <p className="text-muted-foreground">No converted files yet</p>
            <p className="text-sm text-muted-foreground">Upload and convert files to see downloads here</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div 
              className="bg-muted/30 rounded-md p-3 flex items-center justify-between"
              data-testid="download-item"
            >
              <div className="flex items-center space-x-3">
                <FileArchive className="text-warning" size={24} />
                <div>
                  <p className="font-medium text-foreground" data-testid="text-download-filename">
                    {conversionJob.convertedFiles.length > 1 
                      ? "converted_files.zip" 
                      : conversionJob.convertedFiles[0]?.convertedName || "converted_file"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground" data-testid="text-download-size">
                    {conversionJob.convertedFiles.length > 1 
                      ? `${conversionJob.convertedFiles.length} files` 
                      : formatFileSize(conversionJob.convertedFiles[0]?.size || 0)
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleDownload(
                  conversionJob.downloadUrl!,
                  conversionJob.convertedFiles.length > 1 
                    ? "converted_files.zip" 
                    : conversionJob.convertedFiles[0]?.convertedName || "converted_file"
                )}
                data-testid="button-download"
              >
                <Download className="mr-1" size={16} />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-md">
          <div className="flex items-start space-x-2">
            <Shield className="text-accent mt-0.5" size={16} />
            <div>
              <p className="text-sm font-medium text-accent-foreground">Secure Downloads</p>
              <p className="text-xs text-accent-foreground/80 mt-1">
                Files are automatically deleted after 24 hours for your privacy and security.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
