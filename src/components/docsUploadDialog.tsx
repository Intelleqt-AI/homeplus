import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarIcon, FileText, Upload, Sparkles } from "lucide-react";
import { useState } from "react";
import { suggestDocumentCategory } from "@/lib/documentIntelligence";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadFileWithMetadata } from "@/lib/Api";
import { useAuth } from "@/hooks/useAuth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";

const DocsUploadDialog = ({ openForm, setOpenForm }) => {
  const [documentType, setDocumentType] = useState("");
  const [documentStatus, setDocumentStatus] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<any>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [autoSuggested, setAutoSuggested] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`File "${file.name}" selected`);

      // Auto-suggest document type from filename
      const suggestion = suggestDocumentCategory(file.name);
      if (suggestion.confidence !== 'low') {
        const typeMap: Record<string, string> = {
          Certificate: 'certificate',
          Insurance: 'insurance',
          Compliance: 'certificate',
          Report: 'inspection',
          Warranty: 'maintenance',
          Contract: 'other',
          Receipt: 'other',
        };
        const mapped = typeMap[suggestion.type] || '';
        if (mapped && !documentType) {
          setDocumentType(mapped);
          setAutoSuggested(true);
          toast.info(`Auto-detected as "${suggestion.type}" from filename`);
        }
      }
    }
  };

  const uploadMutation = useMutation({
    mutationFn: uploadFileWithMetadata,
    onMutate: () => toast.loading("Uploading...", { id: "upload-toast" }),
    onSuccess: () => {
      toast.dismiss("upload-toast");
      toast.success("Uploaded successfully!");
      setOpenForm(false);
      setSelectedFile(null);
      setDocumentType("");
      setSelectedDate("");
      queryClient.invalidateQueries(["GetAllDocs"]);
    },
    onError: () => {
      toast.dismiss("upload-toast");
      toast.error("Failed to upload document.");
    },
  });

  const handleSubmit = () => {
    const data = {
      type: documentType,
      status: selectedDate,
    };

    uploadMutation.mutate({
      file: selectedFile,
      id: user?.id,
      metadata: data,
    });
  };

  return (
    <Dialog open={openForm} onOpenChange={setOpenForm}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Scan Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Upload Your Document
              </h3>
              <p className="text-muted-foreground text-sm">
                Upload receipts, warranties, certificates, or any home-related
                documents to automatically organize them.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Document File</Label>
              <div className="relative">
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <label htmlFor="file-upload">
                  <div className="flex items-center justify-center p-6 border-2 border-dashed border-border rounded-lg hover:bg-secondary cursor-pointer transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        {selectedFile ? selectedFile.name : "Click to upload"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG, DOC up to 10MB
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="document-type">Document Type</Label>
                {autoSuggested && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full font-medium">
                    <Sparkles className="w-3 h-3" />
                    Auto-detected
                  </span>
                )}
              </div>
              <Select value={documentType} onValueChange={(val) => { setDocumentType(val); setAutoSuggested(false); }}>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-date">Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="status-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-black hover:bg-black hover:text-white",
                      !selectedDate && "text-muted-black"
                    )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      <>Valid until {format(selectedDate, "PPP")}</>
                    ) : (
                      <span>Select validity date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="!text-black"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <Button className="flex-1" onClick={handleSubmit}>
              Continue
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-black text-white hover:bg-primary/90 hover:text-white"
              onClick={() => setOpenForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocsUploadDialog;
