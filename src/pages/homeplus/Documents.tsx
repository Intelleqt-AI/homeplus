import { useState } from "react";
import {
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  Package,
  Camera,
  CalendarIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { listFilesWithMetadata, uploadFileWithMetadata } from "@/lib/Api";
import { useAuth } from "@/hooks/useAuth";
import Modal from "react-modal";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

const documents = [
  {
    name: "Gas Safety Certificate 2024.pdf",
    type: "Certificate",
    date: "15 Jan 2024",
    status: "Valid until 2025",
  },
  {
    name: "EPC Certificate.pdf",
    type: "Certificate",
    date: "03 Mar 2023",
    status: "Valid until 2030",
  },
  {
    name: "Home Insurance Policy.pdf",
    type: "Insurance",
    date: "22 Dec 2023",
    status: "Valid until 2026",
  },
  {
    name: "Boiler Service Report.pdf",
    type: "Maintenance",
    date: "08 Nov 2023",
    status: "Valid until 2024",
  },
  {
    name: "Roof Inspection Photos.zip",
    type: "Inspection",
    date: "12 Oct 2023",
    status: "Action required",
  },
];

const exportOptions = [
  { id: "epc", label: "EPC", key: "epc" },
  { id: "gasSafety", label: "Gas Safety/EICR", key: "gasSafety" },
  { id: "warranties", label: "Warranties", key: "warranties" },
  { id: "serviceHistory", label: "Service History", key: "serviceHistory" },
  { id: "floorPlan", label: "Floor Plan", key: "floorPlan" },
  { id: "photos", label: "Photos", key: "photos" },
];

const getStatusColor = (statusDate: string | undefined) => {
  if (!statusDate) return "text-gray-600 bg-gray-50"; // no date
  if (isPast(new Date(statusDate))) return "text-yellow-600 bg-yellow-50"; // expired
  return "text-green-600 bg-green-50"; // still valid
};

const Documents = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState({
    epc: false,
    gasSafety: false,
    warranties: false,
    serviceHistory: false,
    floorPlan: false,
    photos: false,
  });
  const [openForm, setOpenForm] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [documentStatus, setDocumentStatus] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<any>(null);

  const { user } = useAuth();

  // Fetch files/folders
  const {
    data: docs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["GetAllDocs", user.id],
    queryFn: () => listFilesWithMetadata(user.id),
    enabled: !!user.id,
  });

  const handleDocumentSelection = (key: string, checked: boolean) => {
    setSelectedDocuments((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleGeneratePack = () => {
    console.log("Generating home pack with:", selectedDocuments);
    setIsExportModalOpen(false);
  };

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
      setSelectedDate("");
      refetch();
    },
    onError: (e) => {
      console.log(e);
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

  function downloadFile(url: string, fileName: string) {
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.blob();
      })
      .then((blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(objectUrl);
      })
      .catch(() => toast.error("Download failed"));
  }

  function openViewer(url: string, name: string) {
    console.log({ uri: url, fileName: name });
    setCurrentDoc([{ uri: url, fileName: name }]);
    setViewerOpen(true);
  }

  console.log(docs);

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-black">Documents</h1>
            <div className="flex items-center space-x-3">
              <Dialog
                open={isExportModalOpen}
                onOpenChange={setIsExportModalOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Package className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Export Home Pack
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Export Home Pack</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {exportOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={
                            selectedDocuments[
                              option.key as keyof typeof selectedDocuments
                            ]
                          }
                          onCheckedChange={(checked) =>
                            handleDocumentSelection(
                              option.key,
                              checked as boolean
                            )
                          }
                        />
                        <label
                          htmlFor={option.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsExportModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleGeneratePack}>Generate Pack</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                      Document
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                      Type
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                      Date
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {docs &&
                    docs.length > 0 &&
                    docs.map(({ id, name, metadata, publicUrl }) => (
                      <tr
                        key={id}
                        className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-black">
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {metadata?.metadata?.type}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {metadata?.createdAt
                            ? format(
                                new Date(metadata.createdAt),
                                "dd MMM yyyy"
                              )
                            : "—"}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(
                              metadata?.metadata?.status
                            )}`}>
                            {metadata?.metadata?.status
                              ? isPast(new Date(metadata.metadata.status))
                                ? "Action required"
                                : `Valid until ${format(
                                    new Date(metadata.metadata.status),
                                    "yyyy"
                                  )}`
                              : "—"}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {/* View file */}
                            <button
                              onClick={() => openViewer(publicUrl, name)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors">
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>

                            {/* Download file */}
                            <button
                              onClick={() => downloadFile(publicUrl, name)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors">
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>

                            {/* Delete file */}
                            <button
                              // onClick={() => handleDeleteFile(id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors">
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upload Area */}
          <div
            className="bg-white rounded-lg p-8 border-2 border-dashed border-gray-200 text-center cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setOpenForm(true)}>
            <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="font-semibold text-black mb-2">
              Upload Your Documents
            </h3>
            <p className="text-sm text-gray-600">
              Click here to choose your documents
            </p>
            {/* <Button className="px-6 py-2 font-medium"> Browse Files </Button> */}
          </div>

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
                      Upload receipts, warranties, certificates, or any
                      home-related documents to automatically organize them.
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
                              {selectedFile
                                ? selectedFile.name
                                : "Click to upload"}
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
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}>
                      <SelectTrigger id="document-type">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        {/* <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="other">Other</SelectItem> */}
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
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
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
                    className="flex-1"
                    onClick={() => setOpenForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>

      {/* Viewer Modal */}
      <Modal
        className="!h-[90vh] !max-w-[1200px] !py-7 z-[99999]"
        isOpen={viewerOpen}
        onRequestClose={() => setViewerOpen(false)}
        contentLabel="Document Viewer">
        <div className="navbar  flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2" />
          <div className="buttons flex items-center gap-4 !mt-0 px-2">
            {currentDoc && currentDoc[0]?.fileName && (
              <button
                onClick={() =>
                  downloadFile(currentDoc[0].uri, currentDoc[0].fileName)
                }
                className="text-sm text-[#17181B] bg-transparent h-7 w-7 flex items-center justify-center rounded-full transition-all hover:bg-gray-200"
                title="Download with original filename">
                <Download className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setViewerOpen(false)}
              className="close text-sm text-[#17181B] bg-transparent h-7 w-7 flex items-center justify-center rounded-full transition-all hover:bg-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
                />
              </svg>
            </button>
          </div>
        </div>
        <div style={{ marginTop: "20px", width: "100%", height: "500px" }}>
          <DocViewer
            pluginRenderers={DocViewerRenderers}
            className="DocViewr"
            documents={currentDoc || []}
            config={{
              header: {
                disableHeader: false,
                disableFileName: false,
                retainURLParams: false,
              },
            }}
            style={{ height: "100%" }}
          />
        </div>
      </Modal>
    </>
  );
};

export default Documents;
