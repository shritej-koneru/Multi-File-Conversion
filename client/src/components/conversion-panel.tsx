import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Settings, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { UploadedFile, ConversionJob } from "@/pages/home";

interface ConversionFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface ConversionPanelProps {
  sessionId: string;
  uploadedFiles: UploadedFile[];
  conversionJob: ConversionJob | null;
  onConversionStarted: (job: ConversionJob) => void;
  onConversionUpdated: (job: ConversionJob) => void;
}

export function ConversionPanel({
  sessionId,
  uploadedFiles,
  conversionJob,
  onConversionStarted,
  onConversionUpdated
}: ConversionPanelProps) {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  // Fetch available formats
  const { data: formats } = useQuery<ConversionFormat[]>({
    queryKey: [`/api/formats/${sessionId}`],
    enabled: !!sessionId && uploadedFiles.length > 0,
  });

  // Poll conversion status
  useEffect(() => {
    if (!conversionJob || conversionJob.status === "completed" || conversionJob.status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await apiRequest("GET", `/api/conversion/${conversionJob.id}`);
        const updatedJob = await response.json();
        onConversionUpdated(updatedJob);
        
        if (updatedJob.status === "completed" || updatedJob.status === "failed") {
          setIsConverting(false);
        }
      } catch (error) {
        console.error("Failed to poll conversion status:", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [conversionJob, onConversionUpdated]);

  const handleFormatToggle = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId) 
        ? prev.filter(id => id !== formatId)
        : [...prev, formatId]
    );
  };

  const handleStartConversion = async () => {
    if (selectedFormats.length === 0 || uploadedFiles.length === 0) return;

    setIsConverting(true);
    
    try {
      let requestBody: any = {
        sessionId,
        files: uploadedFiles,
      };
      
      // If multiple formats are selected, send them as an array
      if (selectedFormats.length > 1) {
        requestBody.targetFormats = selectedFormats;
      } else {
        // Single format for backward compatibility
        requestBody.targetFormat = selectedFormats[0];
      }
      
      const response = await apiRequest("POST", "/api/convert", requestBody);
      
      const { conversionId } = await response.json();
      
      const newJob: ConversionJob = {
        id: conversionId,
        status: "pending",
        progress: 0,
        convertedFiles: [],
      };
      
      onConversionStarted(newJob);
    } catch (error: any) {
      console.error("Conversion failed:", error);
      setIsConverting(false);
    }
  };

  const getFormatIcon = (iconClass: string) => {
    const iconMap: { [key: string]: string } = {
      "fas fa-file-pdf": "📄",
      "fas fa-file-image": "🖼️",
      "fas fa-file-archive": "📦",
    };
    return iconMap[iconClass] || "📁";
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Settings className="text-primary mr-2" size={20} />
          Conversion Options
        </h3>

        {uploadedFiles.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="mx-auto text-muted-foreground/50 mb-3" size={48} />
            <p className="text-muted-foreground">Upload files to see conversion options</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3">Available formats for your files:</p>
              
              <div className="space-y-2">
                {formats?.map((format) => (
                  <div
                    key={format.id}
                    className={cn(
                      "border rounded-md p-3 cursor-pointer transition-all duration-200",
                      "hover:bg-secondary/20 hover:-translate-y-0.5 hover:shadow-md",
                      selectedFormats.includes(format.id)
                        ? "bg-secondary/20 border-primary"
                        : "bg-muted/30 border-border"
                    )}
                    onClick={() => handleFormatToggle(format.id)}
                    data-testid={`option-format-${format.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getFormatIcon(format.icon)}</span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{format.name}</p>
                        <p className="text-xs text-muted-foreground">{format.description}</p>
                      </div>
                      <Checkbox
                        checked={selectedFormats.includes(format.id)}
                        data-testid={`checkbox-format-${format.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Convert Button */}
            <Button
              className="w-full"
              onClick={handleStartConversion}
              disabled={selectedFormats.length === 0 || isConverting || (conversionJob?.status === "processing")}
              data-testid="button-convert"
            >
              <Wand2 className="mr-2" size={16} />
              {isConverting || conversionJob?.status === "processing" 
                ? "Converting..." 
                : selectedFormats.length > 1 
                  ? `Convert to ${selectedFormats.length} formats` 
                  : "Convert Files"
              }
            </Button>

            {/* Progress Section */}
            {conversionJob && (conversionJob.status === "processing" || conversionJob.status === "pending") && (
              <div className="mt-4">
                <div className="bg-muted/50 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Converting files...</span>
                    <span className="text-sm text-muted-foreground" data-testid="text-progress">
                      {conversionJob.progress}%
                    </span>
                  </div>
                  <Progress 
                    value={conversionJob.progress} 
                    className="w-full"
                    data-testid="progress-conversion"
                  />
                  <p className="text-xs text-muted-foreground mt-2" data-testid="text-status">
                    {conversionJob.status === "pending" ? "Starting conversion..." : "Processing files..."}
                  </p>
                </div>
              </div>
            )}

            {conversionJob?.status === "failed" && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm">Conversion failed. Please try again.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
