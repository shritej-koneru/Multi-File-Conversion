import { useState } from "react";
import { FileUpload } from "@/components/file-upload";
import { ConversionPanel } from "@/components/conversion-panel";
import { DownloadSection } from "@/components/download-section";

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  extension: string;
  savedPath?: string; // Include saved path for conversion
}

export interface ConversionJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  downloadUrl?: string;
  convertedFiles: Array<{
    originalName: string;
    convertedName: string;
    size: number;
  }>;
}

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [conversionJob, setConversionJob] = useState<ConversionJob | null>(null);

  const handleFilesUploaded = (files: UploadedFile[], sessionId: string) => {
    setUploadedFiles(files);
    setSessionId(sessionId);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleConversionStarted = (job: ConversionJob) => {
    setConversionJob(job);
  };

  const handleConversionUpdated = (job: ConversionJob) => {
    setConversionJob(job);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <i className="fas fa-exchange-alt text-2xl text-primary"></i>
              <h1 className="text-2xl font-bold text-foreground">ConvertHub</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Convert Any File Format</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your files and convert them to different formats instantly. Supports documents, images, videos, audio files, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <FileUpload
              uploadedFiles={uploadedFiles}
              onFilesUploaded={handleFilesUploaded}
              onRemoveFile={handleRemoveFile}
            />
          </div>

          {/* Conversion and Download Panel */}
          <div className="space-y-6">
            <ConversionPanel
              sessionId={sessionId}
              uploadedFiles={uploadedFiles}
              conversionJob={conversionJob}
              onConversionStarted={handleConversionStarted}
              onConversionUpdated={handleConversionUpdated}
            />
            
            <DownloadSection conversionJob={conversionJob} />
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-16 bg-card rounded-lg border border-border shadow-sm p-8">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">Supported Conversions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <i className="fas fa-file-word text-3xl text-primary mb-3"></i>
              <h4 className="font-semibold text-foreground mb-2">Documents</h4>
              <p className="text-sm text-muted-foreground">DOCX, PDF, TXT, RTF</p>
            </div>
            
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <i className="fas fa-image text-3xl text-accent mb-3"></i>
              <h4 className="font-semibold text-foreground mb-2">Images</h4>
              <p className="text-sm text-muted-foreground">PNG, JPG, WEBP, PDF</p>
            </div>
            
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <i className="fas fa-play text-3xl text-warning mb-3"></i>
              <h4 className="font-semibold text-foreground mb-2">Video & Audio</h4>
              <p className="text-sm text-muted-foreground">MP4, MP3, WAV, AVI</p>
            </div>
            
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <i className="fas fa-table text-3xl text-secondary mb-3"></i>
              <h4 className="font-semibold text-foreground mb-2">Spreadsheets</h4>
              <p className="text-sm text-muted-foreground">CSV, XLSX, ODS</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <i className="fas fa-exchange-alt text-xl text-primary"></i>
              <span className="font-bold text-foreground">ConvertHub</span>
            </div>
            <p className="text-muted-foreground text-sm">Fast, secure, and reliable file conversion</p>
            <div className="flex justify-center space-x-6 mt-4 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
