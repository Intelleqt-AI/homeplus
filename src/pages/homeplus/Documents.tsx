import { useState } from "react";
import { 
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  Package
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Documents = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState({
    epc: false,
    gasSafety: false,
    warranties: false,
    serviceHistory: false,
    floorPlan: false,
    photos: false
  });

  const documents = [
    {
      name: "Gas Safety Certificate 2024.pdf",
      type: "Certificate",
      date: "15 Jan 2024",
      status: "Valid until 2025"
    },
    {
      name: "EPC Certificate.pdf",
      type: "Certificate",
      date: "03 Mar 2023",
      status: "Valid until 2030"
    },
    {
      name: "Home Insurance Policy.pdf",
      type: "Insurance",
      date: "22 Dec 2023",
      status: "Valid until 2026"
    },
    {
      name: "Boiler Service Report.pdf",
      type: "Maintenance",
      date: "08 Nov 2023",
      status: "Valid until 2024"
    },
    {
      name: "Roof Inspection Photos.zip",
      type: "Inspection",
      date: "12 Oct 2023",
      status: "Action required"
    }
  ];

  const exportOptions = [
    { id: 'epc', label: 'EPC', key: 'epc' },
    { id: 'gasSafety', label: 'Gas Safety/EICR', key: 'gasSafety' },
    { id: 'warranties', label: 'Warranties', key: 'warranties' },
    { id: 'serviceHistory', label: 'Service History', key: 'serviceHistory' },
    { id: 'floorPlan', label: 'Floor Plan', key: 'floorPlan' },
    { id: 'photos', label: 'Photos', key: 'photos' }
  ];

  const getStatusColor = (status: string) => {
    if (status.includes("Action required")) {
      return "text-yellow-600 bg-yellow-50";
    }
    return "text-gray-600 bg-gray-50";
  };

  const handleDocumentSelection = (key: string, checked: boolean) => {
    setSelectedDocuments(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleGeneratePack = () => {
    console.log('Generating home pack with:', selectedDocuments);
    setIsExportModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-black">Documents</h1>
          <div className="flex items-center space-x-3">
            <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Package className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Export Home Pack</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Export Home Pack</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {exportOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={option.id}
                        checked={selectedDocuments[option.key as keyof typeof selectedDocuments]}
                        onCheckedChange={(checked) => handleDocumentSelection(option.key, checked as boolean)}
                      />
                      <label htmlFor={option.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGeneratePack}>
                    Generate Pack
                  </Button>
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
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Document</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-black">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{doc.type}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{doc.date}</td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
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
        <div className="bg-white rounded-lg p-8 border-2 border-dashed border-gray-200 text-center">
          <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="font-semibold text-black mb-2">Upload new documents</h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <Button className="px-6 py-2 font-medium">
            Browse Files
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Documents;