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
import { CalendarIcon, FileText, Upload } from "lucide-react";
import { useState } from "react";
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
  const [documentCategory, setDocumentCategory] = useState("home");
  const [documentStatus, setDocumentStatus] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`File "${file.name}" selected`);
    }
  };

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`File "${file.name}" selected`);
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
      setDocumentCategory("home");
      setDocumentName("");
      setSelectedDate("");
      queryClient.invalidateQueries(["GetAllDocs"]);
    },
    onError: (e) => {
      console.log(e);
      toast.dismiss("upload-toast");
      toast.error("Failed to upload document.");
    },
  });

  const handleSubmit = () => {
    const data = {
      name: documentName || selectedFile?.name || "Document",
      type: documentType,
      category: documentCategory,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="doc-name">Document Name</Label>
              <Input
                id="doc-name"
                placeholder="e.g. Home Insurance Certificate 2026"
                value={documentName}
                onChange={e => setDocumentName(e.target.value)}
              />
            </div>

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
                  <div
                    className={cn(
                      "flex items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                      isDragging ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"
                    )}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        {selectedFile ? selectedFile.name : "Click or drag & drop to upload"}
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
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="warranty">Warranty</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="id">ID Document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-category">Category</Label>
              <Select value={documentCategory} onValueChange={setDocumentCategory}>
                <SelectTrigger id="document-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="warranties">Warranties</SelectItem>
                  <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
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
