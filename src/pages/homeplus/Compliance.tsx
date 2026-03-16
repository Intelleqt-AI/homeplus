import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Shield, FileCheck, Flame, Zap, Droplets, AlertTriangle, CheckCircle, Clock, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type CertificateStatus = 'valid' | 'expiring' | 'expired' | 'missing';

interface Certificate {
  id: string;
  type: string;
  title: string;
  icon: typeof Shield;
  description: string;
  cadence: string;
  issueDate: string | null;
  expiryDate: string | null;
  engineerName: string | null;
  registrationNumber: string | null;
  status: CertificateStatus;
  documentUploaded: boolean;
  requiredFor: ('landlord' | 'homeowner')[];
}

const SAMPLE_CERTIFICATES: Certificate[] = [
  {
    id: 'gas-safety',
    type: 'Gas Safety (CP12)',
    title: 'Gas Safety Certificate',
    icon: Flame,
    description: 'Annual gas safety inspection required by law for all landlords. Recommended for homeowners.',
    cadence: 'Annual',
    issueDate: '2025-06-15',
    expiryDate: '2026-06-15',
    engineerName: 'John Smith',
    registrationNumber: 'GS-548721',
    status: 'valid',
    documentUploaded: true,
    requiredFor: ['landlord', 'homeowner'],
  },
  {
    id: 'eicr',
    type: 'EICR',
    title: 'Electrical Installation Condition Report',
    icon: Zap,
    description: 'Required every 5 years for rental properties. Tests the safety of fixed electrical installations.',
    cadence: 'Every 5 years',
    issueDate: '2022-03-10',
    expiryDate: '2027-03-10',
    engineerName: 'ABC Electrical Ltd',
    registrationNumber: 'NICEIC-33912',
    status: 'valid',
    documentUploaded: true,
    requiredFor: ['landlord'],
  },
  {
    id: 'epc',
    type: 'EPC',
    title: 'Energy Performance Certificate',
    icon: FileCheck,
    description: 'Required when selling or renting. Valid for 10 years. Rating from A (best) to G (worst).',
    cadence: 'Every 10 years',
    issueDate: '2021-11-20',
    expiryDate: '2031-11-20',
    engineerName: 'Energy Assess UK',
    registrationNumber: 'EPC-88210',
    status: 'valid',
    documentUploaded: false,
    requiredFor: ['landlord', 'homeowner'],
  },
  {
    id: 'pat',
    type: 'PAT Testing',
    title: 'Portable Appliance Testing',
    icon: Zap,
    description: 'Testing of portable electrical appliances. Required for HMO landlords, recommended for all.',
    cadence: 'Annual',
    issueDate: '2025-01-08',
    expiryDate: '2026-01-08',
    engineerName: null,
    registrationNumber: null,
    status: 'expiring',
    documentUploaded: false,
    requiredFor: ['landlord'],
  },
  {
    id: 'legionella',
    type: 'Legionella Risk Assessment',
    title: 'Legionella Risk Assessment',
    icon: Droplets,
    description: 'Assesses the risk of legionella bacteria in water systems. Required for landlords.',
    cadence: 'Every 2 years',
    issueDate: null,
    expiryDate: null,
    engineerName: null,
    registrationNumber: null,
    status: 'missing',
    documentUploaded: false,
    requiredFor: ['landlord'],
  },
  {
    id: 'fire-safety',
    type: 'Fire Safety',
    title: 'Fire Risk Assessment',
    icon: Flame,
    description: 'Required for HMOs and multi-occupancy buildings. Covers smoke alarms, escape routes, and fire doors.',
    cadence: 'Annual review',
    issueDate: '2024-09-01',
    expiryDate: '2025-09-01',
    engineerName: 'SafeHome Fire Services',
    registrationNumber: 'FRA-11047',
    status: 'expired',
    documentUploaded: true,
    requiredFor: ['landlord'],
  },
  {
    id: 'boiler-service',
    type: 'Boiler Service',
    title: 'Boiler Service Record',
    icon: Flame,
    description: 'Annual boiler servicing to maintain warranty and ensure safe operation.',
    cadence: 'Annual',
    issueDate: '2025-11-10',
    expiryDate: '2026-11-10',
    engineerName: 'HeatingPro Ltd',
    registrationNumber: 'GS-221098',
    status: 'valid',
    documentUploaded: true,
    requiredFor: ['landlord', 'homeowner'],
  },
];

const getStatusConfig = (status: CertificateStatus) => {
  switch (status) {
    case 'valid':
      return { label: 'Valid', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, dot: 'bg-emerald-500' };
    case 'expiring':
      return { label: 'Expiring Soon', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, dot: 'bg-amber-500' };
    case 'expired':
      return { label: 'Expired', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, dot: 'bg-red-500' };
    case 'missing':
      return { label: 'Not Added', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: Shield, dot: 'bg-gray-400' };
  }
};

const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDate = (date: string | null): string => {
  if (!date) return 'Not recorded';
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Compliance = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'action'>('all');

  const certificates = SAMPLE_CERTIFICATES;

  const actionRequired = certificates.filter(c => c.status === 'expired' || c.status === 'expiring' || c.status === 'missing');
  const displayCerts = filter === 'action' ? actionRequired : certificates;

  const validCount = certificates.filter(c => c.status === 'valid').length;
  const expiringCount = certificates.filter(c => c.status === 'expiring').length;
  const expiredCount = certificates.filter(c => c.status === 'expired').length;
  const missingCount = certificates.filter(c => c.status === 'missing').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[#1A1A1A] text-2xl font-semibold">Compliance & Certificates</h1>
              <p className="text-[#6B6B6B] text-sm">Track your property's legal and safety requirements</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-[16px] px-5 py-4 border border-[#E8E8E3]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[#6B6B6B] text-sm">Valid</span>
            </div>
            <p className="text-[#1A1A1A] text-2xl font-semibold">{validCount}</p>
          </div>
          <div className="bg-white rounded-[16px] px-5 py-4 border border-[#E8E8E3]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-[#6B6B6B] text-sm">Expiring Soon</span>
            </div>
            <p className="text-[#1A1A1A] text-2xl font-semibold">{expiringCount}</p>
          </div>
          <div className="bg-white rounded-[16px] px-5 py-4 border border-[#E8E8E3]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-[#6B6B6B] text-sm">Expired</span>
            </div>
            <p className="text-[#1A1A1A] text-2xl font-semibold">{expiredCount}</p>
          </div>
          <div className="bg-white rounded-[16px] px-5 py-4 border border-[#E8E8E3]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-[#6B6B6B] text-sm">Not Added</span>
            </div>
            <p className="text-[#1A1A1A] text-2xl font-semibold">{missingCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === 'all' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#4A4A4A] border border-[#E8E8E3] hover:bg-[#F5F5F0]'
            }`}
          >
            All Certificates ({certificates.length})
          </button>
          <button
            onClick={() => setFilter('action')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === 'action' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#4A4A4A] border border-[#E8E8E3] hover:bg-[#F5F5F0]'
            }`}
          >
            Action Required ({actionRequired.length})
          </button>
        </div>

        {/* Certificate Cards */}
        <div className="space-y-3">
          {displayCerts.map(cert => {
            const config = getStatusConfig(cert.status);
            const daysLeft = getDaysUntilExpiry(cert.expiryDate);
            const isExpanded = expandedId === cert.id;

            return (
              <div
                key={cert.id}
                className={`bg-white rounded-[16px] border ${config.border} overflow-hidden transition-all`}
              >
                {/* Card Header — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : cert.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-[#FAFAFA] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`h-10 w-10 rounded-[12px] ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <cert.icon className={`w-5 h-5 ${config.color}`} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#1A1A1A] text-sm font-semibold truncate">{cert.type}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[#6B6B6B] text-xs mt-0.5">
                        {cert.cadence}
                        {daysLeft !== null && daysLeft > 0 && ` · ${daysLeft} days until expiry`}
                        {daysLeft !== null && daysLeft <= 0 && ` · Expired ${Math.abs(daysLeft)} days ago`}
                        {daysLeft === null && ' · No date recorded'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {cert.documentUploaded && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Doc attached</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#9CA3AF]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[#F0F0F0]">
                    <div className="pt-4 space-y-4">
                      <p className="text-[#6B6B6B] text-sm">{cert.description}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[#9CA3AF] text-xs mb-1">Issue Date</p>
                          <p className="text-[#1A1A1A] text-sm font-medium">{formatDate(cert.issueDate)}</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF] text-xs mb-1">Expiry Date</p>
                          <p className="text-[#1A1A1A] text-sm font-medium">{formatDate(cert.expiryDate)}</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF] text-xs mb-1">Engineer / Company</p>
                          <p className="text-[#1A1A1A] text-sm font-medium">{cert.engineerName || 'Not recorded'}</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF] text-xs mb-1">Registration No.</p>
                          <p className="text-[#1A1A1A] text-sm font-medium">{cert.registrationNumber || 'Not recorded'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        {(cert.status === 'expired' || cert.status === 'expiring') && (
                          <Link to="/dashboard/job-leads">
                            <Button className="bg-[#1A1A1A] text-white hover:bg-[#333] text-sm h-9 px-4 rounded-full">
                              Get 3 Quotes
                            </Button>
                          </Link>
                        )}
                        {cert.status === 'missing' && (
                          <Link to="/dashboard/job-leads">
                            <Button className="bg-[#1A1A1A] text-white hover:bg-[#333] text-sm h-9 px-4 rounded-full">
                              Book Inspection
                            </Button>
                          </Link>
                        )}
                        <Link to="/dashboard/documents">
                          <Button variant="outline" className="text-sm h-9 px-4 rounded-full border-[#E8E8E3]">
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            {cert.documentUploaded ? 'View Document' : 'Upload Certificate'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="bg-[#FEF9E7] rounded-[16px] p-5 border border-[#FDE68A]/50">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[#1A1A1A] text-sm font-semibold mb-1">UK Landlord Compliance</h4>
              <p className="text-[#6B6B6B] text-sm leading-relaxed">
                UK landlords are legally required to maintain valid Gas Safety (CP12), EICR, and EPC certificates.
                Failure to comply can result in fines up to £30,000 and criminal prosecution.
                Keep your certificates up to date and store copies securely in your documents vault.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Compliance;
