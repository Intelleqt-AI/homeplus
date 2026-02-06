import { useState } from "react";
import {
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  Package,
  Home,
  Car,
  Shield,
  FolderOpen,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  deleteFile,
  listFilesWithMetadata,
} from "@/lib/Api";
import { useAuth } from "@/hooks/useAuth";
import DocsUploadDialog from "@/components/docsUploadDialog";

const categoryTabs = [
  { id: 'all', label: 'All', icon: FolderOpen },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'warranties', label: 'Warranties', icon: Shield },
  { id: 'miscellaneous', label: 'Miscellaneous', icon: FileText },
];

const getStatusColor = (statusDate: string | undefined) => {
  if (!statusDate) return 'text-gray-600 bg-gray-50'; // no date
  if (isPast(new Date(statusDate))) return 'text-yellow-600 bg-yellow-50'; // expired
  return 'text-green-600 bg-green-50'; // still valid
};

const Documents = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState<string[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');

  const { user } = useAuth();

  // Sample documents for demo purposes with categories
  const sampleDocuments = [
    {
      id: 'sample-1',
      name: 'Home Insurance Certificate 2024',
      metadata: {
        createdAt: '2024-03-15T10:30:00Z',
        metadata: {
          type: 'Insurance',
          category: 'home',
          status: '2025-03-15',
        },
      },
      publicUrl: '#',
    },
    {
      id: 'sample-2',
      name: 'Building Regulations Certificate',
      metadata: {
        createdAt: '2023-08-22T14:15:00Z',
        metadata: {
          type: 'Compliance',
          category: 'home',
          status: null,
        },
      },
      publicUrl: '#',
    },
    {
      id: 'sample-3',
      name: 'Car Insurance Policy',
      metadata: {
        createdAt: '2024-01-10T09:00:00Z',
        metadata: {
          type: 'Insurance',
          category: 'car',
          status: '2025-01-10',
        },
      },
      publicUrl: '#',
    },
    {
      id: 'sample-4',
      name: 'Fridge Freezer Warranty',
      metadata: {
        createdAt: '2022-11-05T16:45:00Z',
        metadata: {
          type: 'Warranty',
          category: 'warranties',
          status: '2024-11-05',
        },
      },
      publicUrl: '#',
    },
    {
      id: 'sample-5',
      name: 'Washing Machine Receipt',
      metadata: {
        createdAt: '2023-06-18T11:20:00Z',
        metadata: {
          type: 'Receipt',
          category: 'miscellaneous',
          status: null,
        },
      },
      publicUrl: '#',
    },
    {
      id: 'sample-6',
      name: 'MOT Certificate',
      metadata: {
        createdAt: '2024-02-20T10:00:00Z',
        metadata: {
          type: 'Certificate',
          category: 'car',
          status: '2025-02-20',
        },
      },
      publicUrl: '#',
    },
    {
      id: 'sample-7',
      name: 'Boiler Warranty',
      metadata: {
        createdAt: '2023-01-15T09:30:00Z',
        metadata: {
          type: 'Warranty',
          category: 'warranties',
          status: '2028-01-15',
        },
      },
      publicUrl: '#',
    },
    {
      id: 'sample-8',
      name: 'EPC Certificate',
      metadata: {
        createdAt: '2023-05-10T14:00:00Z',
        metadata: {
          type: 'Certificate',
          category: 'home',
          status: '2033-05-10',
        },
      },
      publicUrl: '#',
    },
  ];

  // Fetch files/folders
  const {
    data: apiDocs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['GetAllDocs', user.id],
    queryFn: () => listFilesWithMetadata(user.id),
    enabled: !!user.id,
  });

  // Combine API docs with sample documents (sample docs shown when no API data)
  const allDocs = apiDocs && apiDocs.length > 0 ? apiDocs : sampleDocuments;

  // Filter documents by active tab
  const docs = activeTab === 'all'
    ? allDocs
    : allDocs.filter(doc => doc.metadata?.metadata?.category === activeTab);

  const handleExportSelection = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedForExport(prev => [...prev, docId]);
    } else {
      setSelectedForExport(prev => prev.filter(id => id !== docId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = allDocs?.filter(item => item.id && item.name !== 'cover').map(item => item.id) || [];
      setSelectedForExport(allIds);
    } else {
      setSelectedForExport([]);
    }
  };

  const handleGeneratePack = () => {
    const selectedDocs = allDocs?.filter(doc => selectedForExport.includes(doc.id));
    console.log('Generating home pack with:', selectedDocs);
    toast.success(`Exporting ${selectedForExport.length} documents`);
    setIsExportModalOpen(false);
  };

  // File delete Function
  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onMutate: () => {
      toast.loading('Deleting...', { id: 'delete-toast' });
    },
    onSuccess: () => {
      refetch();
      toast.dismiss('delete-toast');
      toast.success(`Deleted successfully!`);
    },
    onError: () => {
      toast.dismiss('delete-toast');
      toast.error('Failed to delete file.');
    },
  });

  function downloadFile(url: string, fileName: string) {
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.blob();
      })
      .then(blob => {
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(objectUrl);
      })
      .catch(() => toast.error('Download failed'));
  }

  function openPreview(doc: any) {
    setPreviewDoc(doc);
  }

  function getFakeDocumentContent(name: string, type: string) {
    switch (type) {
      case 'Insurance':
        return (
          <div className="bg-white border border-[#E8E8E3] rounded-[16px] overflow-hidden">
            <div className="bg-[#1A1A1A] text-white px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">Certificate of Insurance</p>
                  <h3 className="text-lg font-semibold mt-1">{name}</h3>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#FBBF24]" />
                </div>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Policy Number</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">HP-INS-2024-{Math.floor(Math.random() * 9000 + 1000)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Provider</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">Aviva Home Insurance</p>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Policy Holder</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">Mr J. Smith</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Property Address</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">14 Oak Lane, London, SW1A 1AA</p>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Start Date</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">15 Mar 2024</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">End Date</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">15 Mar 2025</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Annual Premium</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">£342.00</p>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Coverage</p>
                <div className="space-y-2">
                  {['Buildings Cover — £350,000', 'Contents Cover — £75,000', 'Personal Possessions — £5,000', 'Accidental Damage — Included'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-[#4A4A4A]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'Compliance':
        return (
          <div className="bg-white border border-[#E8E8E3] rounded-[16px] overflow-hidden">
            <div className="bg-[#1A1A1A] text-white px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">Compliance Certificate</p>
                  <h3 className="text-lg font-semibold mt-1">{name}</h3>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#FBBF24]" />
                </div>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Reference Number</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">BR/2023/{Math.floor(Math.random() * 9000 + 1000)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Issued By</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">London Borough Council</p>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Property Address</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">14 Oak Lane, London, SW1A 1AA</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Date of Issue</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">22 Aug 2023</p>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Compliance Details</p>
                <div className="space-y-2">
                  {[
                    'Structural alterations comply with Building Regulations 2010',
                    'Fire safety requirements met (Part B)',
                    'Electrical installation compliant (Part P)',
                    'Energy efficiency standards met (Part L)',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-[#4A4A4A]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Inspector</p>
                <p className="text-sm font-medium text-[#1A1A1A]">D. Williams, RICS Chartered Surveyor</p>
              </div>
            </div>
          </div>
        );

      case 'Warranty':
        return (
          <div className="bg-white border border-[#E8E8E3] rounded-[16px] overflow-hidden">
            <div className="bg-[#1A1A1A] text-white px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">Product Warranty</p>
                  <h3 className="text-lg font-semibold mt-1">{name}</h3>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#FBBF24]" />
                </div>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Product</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{name.replace(' Warranty', '')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Serial Number</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">SN-{Math.floor(Math.random() * 900000 + 100000)}</p>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Manufacturer</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{name.includes('Boiler') ? 'Worcester Bosch' : 'Samsung'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Purchase Date</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{name.includes('Boiler') ? '15 Jan 2023' : '05 Nov 2022'}</p>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Warranty Period</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{name.includes('Boiler') ? '5 Years' : '2 Years'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Warranty Expires</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{name.includes('Boiler') ? '15 Jan 2028' : '05 Nov 2024'}</p>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Coverage Includes</p>
                <div className="space-y-2">
                  {['Manufacturing defects', 'Parts & labour', 'Call-out charges', 'Annual service included'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-[#4A4A4A]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'Receipt':
        return (
          <div className="bg-white border border-[#E8E8E3] rounded-[16px] overflow-hidden">
            <div className="bg-[#1A1A1A] text-white px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">Purchase Receipt</p>
                  <h3 className="text-lg font-semibold mt-1">{name}</h3>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#FBBF24]" />
                </div>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Store</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">Currys PC World</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Receipt No.</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">RC-{Math.floor(Math.random() * 900000 + 100000)}</p>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4">
                <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-3">Items</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A4A4A]">Samsung Ecobubble™ Washing Machine 9kg</span>
                    <span className="font-medium text-[#1A1A1A]">£449.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A4A4A]">Delivery & Installation</span>
                    <span className="font-medium text-[#1A1A1A]">£29.99</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A4A4A]">5 Year Extended Warranty</span>
                    <span className="font-medium text-[#1A1A1A]">£89.99</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4 flex justify-between">
                <span className="text-sm font-semibold text-[#1A1A1A]">Total</span>
                <span className="text-sm font-semibold text-[#1A1A1A]">£568.98</span>
              </div>
              <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Payment Method</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">Visa •••• 4521</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Transaction Date</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">18 Jun 2023</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Certificate':
      default:
        return (
          <div className="bg-white border border-[#E8E8E3] rounded-[16px] overflow-hidden">
            <div className="bg-[#1A1A1A] text-white px-8 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider">{name.includes('MOT') ? 'MOT Test Certificate' : name.includes('EPC') ? 'Energy Performance Certificate' : 'Certificate'}</p>
                  <h3 className="text-lg font-semibold mt-1">{name}</h3>
                </div>
                <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#FBBF24]" />
                </div>
              </div>
            </div>
            <div className="px-8 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Certificate Number</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{name.includes('MOT') ? 'MOT' : 'EPC'}-{Math.floor(Math.random() * 900000 + 100000)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">{name.includes('MOT') ? 'Testing Station' : 'Assessor'}</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">{name.includes('MOT') ? 'Kwik Fit — Clapham' : 'GreenEnergy Assessments Ltd'}</p>
                </div>
              </div>
              {name.includes('MOT') ? (
                <>
                  <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Vehicle Registration</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">AB21 CDE</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Make & Model</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">Volkswagen Golf 1.5 TSI</p>
                    </div>
                  </div>
                  <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Test Date</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">20 Feb 2024</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Expiry Date</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">20 Feb 2025</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Mileage</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">34,218</p>
                    </div>
                  </div>
                  <div className="border-t border-[#E8E8E3] pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-700">PASS</span>
                    </div>
                    <div className="space-y-2">
                      {['Brakes — Pass', 'Suspension — Pass', 'Lights — Pass', 'Emissions — Pass'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs text-[#4A4A4A]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Property Address</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">14 Oak Lane, London, SW1A 1AA</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Assessment Date</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">10 May 2023</p>
                    </div>
                  </div>
                  <div className="border-t border-[#E8E8E3] pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-14 w-14 rounded-[10px] bg-[#22C55E] flex items-center justify-center">
                        <span className="text-white text-xl font-bold">B</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">Energy Rating: B (82)</p>
                        <p className="text-xs text-[#6B6B6B]">Very energy efficient</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {['Wall insulation — Cavity fill', 'Roof insulation — 250mm loft', 'Windows — Double glazed', 'Heating — Gas condensing boiler'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs text-[#4A4A4A]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-[#E8E8E3] pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Valid Until</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">10 May 2033</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">RRN</p>
                      <p className="text-sm font-medium text-[#1A1A1A]">0382-1947-6253-8190-4021</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
    }
  }

  // Delete files or folders
  const handleDeleteTask = name => {
    deleteMutation.mutate({
      fileName: name,
      id: user?.id,
    });
  };

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section - Dashboard Style */}
          <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[#6B6B6B] text-sm mb-0.5">Your documents</p>
                  <h1 className="text-[#1A1A1A] text-2xl font-semibold">Documents</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={selectedForExport.length === 0}
                  className="text-[#1A1A1A] hover:bg-[#F5F5F0] border border-[#E8E8E3] bg-white transition-all text-sm font-medium h-10 px-4 rounded-full disabled:opacity-50"
                >
                  <Package className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Export Pack {selectedForExport.length > 0 && `(${selectedForExport.length})`}
                </Button>
                <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Export Home Pack</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-[#6B6B6B] mb-4">
                        You have selected {selectedForExport.length} document{selectedForExport.length !== 1 ? 's' : ''} to export.
                      </p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {allDocs?.filter(doc => selectedForExport.includes(doc.id)).map(doc => (
                          <div key={doc.id} className="flex items-center gap-3 p-2 bg-[#F5F5F0] rounded-lg">
                            <FileText className="w-4 h-4 text-[#6B6B6B]" />
                            <span className="text-sm text-[#1A1A1A]">{doc.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleGeneratePack} className="bg-[#1A1A1A] text-white hover:bg-[#333333]">
                        Generate Pack
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={() => setOpenForm(true)}
                  className="bg-[#1A1A1A] text-white hover:bg-[#333333] transition-all text-sm font-medium h-10 px-4 rounded-full"
                >
                  <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Upload Document
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B6B6B] text-sm">Total Documents</span>
                  <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[#1A1A1A] text-2xl font-semibold">{allDocs?.filter(item => item.id && item.name !== 'cover')?.length || 0}</p>
                <p className="text-[#8B8B8B] text-xs mt-1">Stored safely</p>
              </div>

              <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B6B6B] text-sm">Home</span>
                  <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                    <Home className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[#1A1A1A] text-2xl font-semibold">{allDocs?.filter(item => item.metadata?.metadata?.category === 'home')?.length || 0}</p>
                <p className="text-[#8B8B8B] text-xs mt-1">Home documents</p>
              </div>

              <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B6B6B] text-sm">Car</span>
                  <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                    <Car className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[#1A1A1A] text-2xl font-semibold">{allDocs?.filter(item => item.metadata?.metadata?.category === 'car')?.length || 0}</p>
                <p className="text-[#8B8B8B] text-xs mt-1">Vehicle documents</p>
              </div>

              <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#6B6B6B] text-sm">Action Required</span>
                  <div className="h-8 w-8 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#DC2626]" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[#DC2626] text-2xl font-semibold">{allDocs?.filter(item => item.metadata?.metadata?.status && isPast(new Date(item.metadata.metadata.status)))?.length || 0}</p>
                <p className="text-[#8B8B8B] text-xs mt-1">Need attention</p>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
            <div className="flex items-center gap-2 mb-6">
              {categoryTabs.map(tab => {
                const isActive = activeTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-[#1A1A1A] text-white'
                        : 'text-[#4A4A4A] hover:bg-[#F5F5F0] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" strokeWidth={1.5} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Select All Row */}
            {docs?.filter(item => item.id && item.name !== 'cover')?.length > 0 && (
              <div className="flex items-center justify-end mb-4 px-5 py-2">
                {selectedForExport.length > 0 && (
                  <span className="text-sm text-[#FBBF24] font-medium mr-4">
                    {selectedForExport.length} selected
                  </span>
                )}
                <label htmlFor="select-all" className="text-sm text-[#6B6B6B] cursor-pointer mr-3">
                  Select all for export
                </label>
                <div className="flex-shrink-0 pl-2 border-l border-[#E8E8E3]">
                  <Checkbox
                    id="select-all"
                    checked={selectedForExport.length === allDocs?.filter(item => item.id && item.name !== 'cover')?.length}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
              </div>
            )}

            {/* Documents List */}
            <div className="space-y-3">
              {docs &&
                docs.length > 0 &&
                docs
                  .filter(item => item.id && item.name !== 'cover')
                  .map(({ id, name, metadata, publicUrl }) => (
                    <div
                      key={id}
                      className="bg-[#F5F5F0] rounded-[12px] px-5 py-4 hover:shadow-sm transition-all flex items-center gap-4"
                    >
                      {/* Document Icon */}
                      <div className="h-10 w-10 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#4A4A4A]" strokeWidth={1.5} />
                      </div>

                      {/* Document Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[#1A1A1A] text-sm font-medium truncate">{name}</h4>
                        <p className="text-[#6B6B6B] text-xs">{metadata?.metadata?.type || 'Document'}</p>
                      </div>

                      {/* Category Badge */}
                      <div className="flex-shrink-0">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#E8E8E3] text-[#4A4A4A] capitalize">
                          {metadata?.metadata?.category || 'misc'}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="flex-shrink-0 w-24 text-right">
                        <p className="text-[#6B6B6B] text-xs">
                          {metadata?.createdAt ? format(new Date(metadata.createdAt), 'dd MMM yyyy') : '—'}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0 w-24">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(metadata?.metadata?.status)}`}>
                          {metadata?.metadata?.status
                            ? isPast(new Date(metadata.metadata.status))
                              ? 'Expired'
                              : 'Valid'
                            : 'No expiry'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openPreview({ id, name, metadata, publicUrl })}
                          className="p-2 text-[#4A4A4A] hover:bg-[#E8E8E3] rounded-full transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadFile(publicUrl, name)}
                          className="p-2 text-[#4A4A4A] hover:bg-[#E8E8E3] rounded-full transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(name)}
                          className="p-2 text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-full transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Export Checkbox */}
                      <div className="flex-shrink-0 pl-2 border-l border-[#E8E8E3]">
                        <Checkbox
                          id={`export-${id}`}
                          checked={selectedForExport.includes(id)}
                          onCheckedChange={(checked) => handleExportSelection(id, checked as boolean)}
                        />
                      </div>
                    </div>
                  ))}

              {/* Upload Row */}
              <div
                className="bg-white rounded-[12px] px-5 py-4 border-2 border-dashed border-[#E8E8E3] cursor-pointer hover:bg-[#F5F5F0] hover:border-[#FBBF24] transition-all flex items-center gap-4"
                onClick={() => setOpenForm(true)}
              >
                <div className="h-10 w-10 rounded-[10px] bg-[#FEF9E7] flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#1A1A1A] text-sm font-medium">Upload Document</h4>
                  <p className="text-[#6B6B6B] text-xs">Click to add a new document</p>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {docs?.filter(item => item.id && item.name !== 'cover')?.length === 0 && (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-[#F5F5F0] flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-[#6B6B6B]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[#1A1A1A] text-lg font-medium mb-2">No documents in this category</h3>
                <p className="text-[#6B6B6B] text-sm mb-4">Upload your first document to get started</p>
                <Button
                  onClick={() => setOpenForm(true)}
                  className="bg-[#1A1A1A] text-white hover:bg-[#333333] rounded-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            )}
          </div>

          <DocsUploadDialog
            openForm={openForm}
            setOpenForm={setOpenForm}
            refetch={refetch}
          />

          {/* Delete Confirmation Dialog */}
          {/* <DeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget) {
            handleDeleteTask(deleteTarget.name, deleteTarget.isFolder);
            setDeleteTarget(null);
          }
        }}
        title={deleteTarget?.isFolder ? "Delete Folder" : "Delete File"}
        description="Are you sure you want to delete this item? This action cannot be undone."
        itemName={deleteTarget?.name}
        requireConfirmation={false}
      /> */}

          {/* Document Preview Dialog */}
          <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-0 rounded-[20px] border border-[#E8E8E3]">
              {previewDoc && (
                <>
                  {/* Preview Header */}
                  <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[10px] bg-[#F5F5F0] border border-[#E8E8E3] flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#4A4A4A]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-[#1A1A1A] text-base font-semibold">{previewDoc.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#6B6B6B]">{previewDoc.metadata?.metadata?.type || 'Document'}</span>
                          <span className="text-[#E8E8E3]">·</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#E8E8E3] text-[#4A4A4A] capitalize">
                            {previewDoc.metadata?.metadata?.category || 'misc'}
                          </span>
                          <span className="text-[#E8E8E3]">·</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(previewDoc.metadata?.metadata?.status)}`}>
                            {previewDoc.metadata?.metadata?.status
                              ? isPast(new Date(previewDoc.metadata.metadata.status))
                                ? 'Expired'
                                : 'Valid'
                              : 'No expiry'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fake Document Preview */}
                  <div className="px-6 pb-4">
                    {getFakeDocumentContent(previewDoc.name, previewDoc.metadata?.metadata?.type || 'Certificate')}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E8E3] bg-[#FAFAF7]">
                    <p className="text-xs text-[#6B6B6B]">
                      Uploaded {previewDoc.metadata?.createdAt ? format(new Date(previewDoc.metadata.createdAt), 'dd MMM yyyy') : '—'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => previewDoc.publicUrl !== '#' && downloadFile(previewDoc.publicUrl, previewDoc.name)}
                        className="text-[#1A1A1A] border-[#E8E8E3] hover:bg-[#F5F5F0] text-sm h-9 px-4 rounded-full"
                      >
                        <Download className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
                        Download
                      </Button>
                      <Button
                        onClick={() => setPreviewDoc(null)}
                        className="bg-[#1A1A1A] text-white hover:bg-[#333333] text-sm h-9 px-4 rounded-full"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </>
  );
};

export default Documents;
