import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface TestFile {
    name: string;
    category: string;
    path: string;
    extension: string;
    size: number;
    supportedConversions: string[];
}

export function TestConversion() {
    const [open, setOpen] = useState(false);
    const [testFiles, setTestFiles] = useState<TestFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>("");
    const [targetFormat, setTargetFormat] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [converting, setConverting] = useState(false);
    const { toast } = useToast();

    // Fetch test files when modal opens
    useEffect(() => {
        if (open && testFiles.length === 0) {
            fetchTestFiles();
        }
    }, [open]);

    const fetchTestFiles = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/test-files");
            const data = await response.json();
            setTestFiles(data.files || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load test files",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedTestFile = testFiles.find((f) => f.path === selectedFile);

    const handleStartConversion = async () => {
        if (!selectedFile || !targetFormat) {
            toast({
                title: "Missing Selection",
                description: "Please select a test file and target format",
                variant: "destructive",
            });
            return;
        }

        setConverting(true);
        try {
            // Start conversion
            const response = await fetch("/api/test-convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testFilePath: selectedFile,
                    targetFormat,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Conversion failed");
            }

            // Poll for completion
            const conversionId = data.conversionId;
            let attempts = 0;
            const maxAttempts = 30;

            const pollStatus = async () => {
                if (attempts >= maxAttempts) {
                    throw new Error("Conversion timeout");
                }

                attempts++;
                const statusResponse = await fetch(`/api/conversion/${conversionId}`);
                const statusData = await statusResponse.json();

                console.log('Conversion status:', statusData);

                if (statusData.status === "completed") {
                    toast({
                        title: "Conversion Complete!",
                        description: "Downloading file...",
                    });

                    // Use the download URL from the response, or construct it
                    const downloadUrl = statusData.downloadUrl || `/api/download/${conversionId}`;
                    console.log('Downloading from:', downloadUrl);

                    // Download the file without navigation using a temporary anchor element
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = ''; // Enable download instead of navigation
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Close modal and reset
                    setTimeout(() => {
                        setOpen(false);
                        setSelectedFile("");
                        setTargetFormat("");
                        setConverting(false);
                    }, 500);
                } else if (statusData.status === "failed") {
                    throw new Error("Conversion failed");
                } else {
                    // Still processing, poll again
                    setTimeout(pollStatus, 1000);
                }
            };

            pollStatus();
        } catch (error) {
            toast({
                title: "Conversion Failed",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive",
            });
            setConverting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    🧪 Test Conversion
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Test File Conversion</DialogTitle>
                    <DialogDescription>
                        Try converting sample files without uploading your own
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : testFiles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No test files available. Add files to public/test-files/
                        </div>
                    ) : (
                        <>
                            {/* File Selection */}
                            <div className="space-y-3">
                                <Label>Select Test File</Label>
                                <RadioGroup value={selectedFile} onValueChange={setSelectedFile}>
                                    {testFiles.map((file) => (
                                        <div key={file.path} className="flex items-start space-x-3 space-y-0">
                                            <RadioGroupItem value={file.path} id={file.path} />
                                            <Label
                                                htmlFor={file.path}
                                                className="font-normal cursor-pointer flex-1"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{file.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {file.category} • {(file.size / 1024).toFixed(1)} KB
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {file.extension}
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {/* Format Selection */}
                            {selectedTestFile && (
                                <div className="space-y-2">
                                    <Label htmlFor="format">Convert To</Label>
                                    <Select value={targetFormat} onValueChange={setTargetFormat}>
                                        <SelectTrigger id="format">
                                            <SelectValue placeholder="Select target format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedTestFile.supportedConversions.map((format) => (
                                                <SelectItem key={format} value={format}>
                                                    {format.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Convert Button */}
                            <Button
                                onClick={handleStartConversion}
                                disabled={!selectedFile || !targetFormat || converting}
                                className="w-full"
                            >
                                {converting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    "Start Test Conversion"
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
