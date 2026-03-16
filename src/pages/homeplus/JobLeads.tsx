import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Edit, Filter, Plus, MapPin, Clock, PoundSterling, Star, ExternalLink, X, Search, Briefcase, CheckCircle, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createJob, fetchLeads, modifyBid } from '@/lib/Api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Quote from '@/components/topbar/Quote';
import { toast } from 'sonner';
import JobStatusPipeline, { getJobPipelineStage } from '@/components/trades/JobStatusPipeline';
import TradeReview from '@/components/trades/TradeReview';

const JobLeads = () => {
  const [compareMode, setCompareMode] = useState<Record<number, boolean>>({});
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const queryClient = useQueryClient();
  const [currentItem, setCurrentItem] = useState(null);
  const [currentBid, setCurrentBid] = useState(null);

  const addJob = useMutation({
    mutationFn: createJob,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setCurrentItem(null);
      setCurrentBid(null);
    },
    onError: () => {
      toast.error('Failed to create job. Please try again.');
    },
  });

  const modifyBidMutation = useMutation({
    mutationFn: modifyBid,
    onSuccess: data => {
      toast.success('Bid updated successfully ');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      const newJob = {
        trade: currentItem?.service,
        location: currentItem?.location,
        rate: currentBid?.proposedValue,
        status: 'todo',
        priority: 'medium',
        leads_id: currentItem?.id,
        trader_id: currentBid?.bid_by,
      };
      addJob.mutate(newJob);
    },
    onError: error => {
      toast.error(error.message || 'Failed to update bid ');
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
  });

  useEffect(() => {
    if (isLoading) return;
    if (data) {
      setLeads(data.filter((lead: any) => lead.homeID === user?.id) || []);
    }
  }, [data, isLoading, user]);

  const getStatusColor = isApproved => {
    switch (isApproved) {
      case isApproved !== 'true':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'awaiting_quotes':
        return 'Awaiting Quotes';
      case 'quotes_received':
        return 'Quotes Received';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Unknown';
    }
  };

  // real bids come from job.bids (each bid contains bidder info and proposedValue)
  // helper to format bidder name
  const bidderName = (b: unknown) => {
    if (!b) return 'Unknown Trade';
    const bb = b as Record<string, any>;
    const first = bb.first_name || bb.bidder?.first_name || '';
    const last = bb.last_name || bb.bidder?.last_name || '';
    return `${first} ${last}`.trim() || bb.tradeName || bb.bidder?.email || 'Trade';
  };

  const toggleCompareMode = (jobId: number) => {
    setCompareMode(prev => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const handleApprove = (job, bid) => {
    setCurrentItem(job);
    setCurrentBid(bid);
    modifyBidMutation.mutate({
      bid_id: bid.id,
      status: 'accepted',
      lead_id: job.id,
      isApproved: true,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section - Dashboard Style */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[#6B6B6B] text-sm mb-0.5">Find tradespeople</p>
                <h1 className="text-[#1A1A1A] text-2xl font-semibold">Find a Trade</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setQuoteOpen(true)}
                className="bg-[#1A1A1A] text-white hover:bg-[#333333] transition-all text-sm font-medium h-10 px-4 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Post Job
              </Button>
              <Quote open={quoteOpen} setOpen={setQuoteOpen} />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Total Jobs</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-2xl font-semibold">{leads?.length || 0}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">All posted jobs</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Active</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#1A1A1A] text-2xl font-semibold">{leads?.filter(l => !l.isApproved)?.length || 0}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Awaiting quotes</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Quotes Received</span>
                <div className="h-8 w-8 rounded-full bg-[#FEF9E7] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-[#FBBF24]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#FBBF24] text-2xl font-semibold">{leads?.reduce((acc, l) => acc + (l.bids?.length || 0), 0) || 0}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">From tradespeople</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-[16px] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#6B6B6B] text-sm">Completed</span>
                <div className="h-8 w-8 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[#10B981] text-2xl font-semibold">{leads?.filter(l => l.isApproved)?.length || 0}</p>
              <p className="text-[#8B8B8B] text-xs mt-1">Jobs completed</p>
            </div>
          </div>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Job Leads (3 columns wide) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#1A1A1A] text-lg font-semibold">Your Jobs</h2>
                <button className="px-4 py-2 text-sm font-medium text-[#4A4A4A] hover:bg-[#F5F5F0] rounded-full transition-colors flex items-center gap-2 border border-[#E8E8E3]">
                  <Filter className="w-3 h-3" />
                  Filter
                </button>
              </div>

              <div className="space-y-3">
                {leads?.map(job => (
                  <div key={job.id} className="bg-[#F5F5F0] rounded-[12px] px-5 py-4 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-10 w-10 rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-[#4A4A4A]" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#1A1A1A] text-sm font-medium">{job.name}</h3>
                          <p className="text-[#6B6B6B] text-xs mt-0.5">{job.service}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-[#6B6B6B]">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <PoundSterling className="w-3 h-3" />
                              <span>{job.value}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(job.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          job?.isApproved
                            ? 'bg-green-50 text-green-600'
                            : job?.bids?.length < 1
                            ? 'bg-gray-50 text-gray-600'
                            : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {job?.isApproved ? 'Approved' : job?.bids?.length < 1 ? 'Waiting for quote' : `${job?.bids?.length} Quote${job?.bids?.length > 1 ? 's' : ''}`}
                        </span>
                        <button
                          onClick={() => toggleCompareMode(job.id)}
                          className="px-3 py-1.5 text-xs font-medium text-[#4A4A4A] bg-white border border-[#E8E8E3] rounded-full hover:bg-[#E8E8E3] transition-colors"
                        >
                          {compareMode[job.id] ? 'Hide quotes' : 'View quotes'}
                        </button>
                      </div>
                    </div>

                    {/* Job Status Pipeline */}
                    <div className="mt-3 pt-3 border-t border-[#E8E8E3]">
                      <JobStatusPipeline currentStage={getJobPipelineStage(job)} />
                    </div>

                    {/* Review Prompt for Completed Jobs */}
                    {job.isApproved && job.bids?.some((b: any) => b.status === 'accepted') && (
                      <div className="mt-3">
                        <TradeReview
                          tradeName={job.bids.find((b: any) => b.status === 'accepted')?.bidder?.first_name || 'Tradesperson'}
                          jobTitle={job.service || job.name}
                          onSubmit={(review) => {
                            // In production, this would save to the database
                          }}
                        />
                      </div>
                    )}

                    {/* Quotes Section */}
                    {(job.bids?.length > 0) && compareMode[job.id] && (
                      <div className="mt-4 pt-4 border-t border-[#E8E8E3]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {job.bids?.map(bid => (
                            <div key={bid.id} className="bg-white rounded-[10px] p-4 border border-[#E8E8E3]">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-[#1A1A1A]">{bid.bidder?.first_name || bid.bidder?.email}</h4>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-[#6B6B6B]">4.0</span>
                                </div>
                              </div>
                              <div className="space-y-1 text-xs text-[#6B6B6B]">
                                <div className="flex justify-between">
                                  <span>Price:</span>
                                  <span className="font-medium text-[#1A1A1A]">{`£${bid.proposedValue}`}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Available:</span>
                                  <span className="capitalize">{bid.Available}</span>
                                </div>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    className="w-full mt-3 px-3 py-2 text-xs font-medium text-[#4A4A4A] bg-[#F5F5F0] rounded-full hover:bg-[#E8E8E3] transition-colors"
                                    onClick={() => setSelectedQuote(bid)}
                                  >
                                    {bid.status == 'accepted' ? 'Accepted' : 'View Details'}
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                  <DialogHeader>
                                    <DialogTitle>Bid Details - {bid.bidder?.first_name || bid.bidder?.email}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Bidder</label>
                                        <p className="text-lg font-semibold text-black">
                                          {bid.bidder?.first_name} {bid.bidder?.last_name}
                                        </p>
                                        <p className="text-sm text-gray-600">{bid.bidder?.email}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Price</label>
                                        <p className="text-lg font-semibold text-black">{`£${bid.proposedValue}`}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Status</label>
                                        <p className="text-sm text-gray-600 capitalize">{bid.status}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Available</label>
                                        <p className="font-medium text-black capitalize">{bid.Available}</p>
                                      </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                      <h4 className="font-medium text-black mb-2">Service Details</h4>
                                      <p className="text-gray-600 text-sm">
                                        Professional service. Contact via email {bid.bidder?.email} for more info.
                                      </p>
                                    </div>
                                    <div className="flex space-x-3 pt-4">
                                      <Button
                                        disabled={bid.status == 'accepted' || job?.isApproved}
                                        onClick={() => handleApprove(job, bid)}
                                        className="flex-1"
                                      >
                                        {bid.status == 'accepted' ? 'Accepted' : 'Accept Bid'}
                                      </Button>
                                      <Button variant="outline" className="flex-1">
                                        Message Bidder
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Post Job Row */}
                <div
                  className="bg-white rounded-[12px] px-5 py-4 border-2 border-dashed border-[#E8E8E3] cursor-pointer hover:bg-[#F5F5F0] hover:border-[#FBBF24] transition-all flex items-center gap-4"
                  onClick={() => setQuoteOpen(true)}
                >
                  <div className="h-10 w-10 rounded-[10px] bg-[#FEF9E7] flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-[#FBBF24]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#1A1A1A] text-sm font-medium">Post a New Job</h4>
                    <p className="text-[#6B6B6B] text-xs">Click to get quotes from local tradespeople</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Info Panel */}
          <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[#1A1A1A] text-lg font-semibold">How It Works</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F5F5F0] rounded-[12px] p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-[#FEF9E7] rounded-full flex items-center justify-center text-sm font-semibold text-[#FBBF24]">1</div>
                  <div>
                    <h4 className="text-[#1A1A1A] text-sm font-medium">Post Your Job</h4>
                    <p className="text-[#6B6B6B] text-xs mt-1">Describe what you need done with all the details</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#F5F5F0] rounded-[12px] p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-[#FEF9E7] rounded-full flex items-center justify-center text-sm font-semibold text-[#FBBF24]">2</div>
                  <div>
                    <h4 className="text-[#1A1A1A] text-sm font-medium">Receive Quotes</h4>
                    <p className="text-[#6B6B6B] text-xs mt-1">Get quotes from verified local tradespeople</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#F5F5F0] rounded-[12px] p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-[#FEF9E7] rounded-full flex items-center justify-center text-sm font-semibold text-[#FBBF24]">3</div>
                  <div>
                    <h4 className="text-[#1A1A1A] text-sm font-medium">Choose & Book</h4>
                    <p className="text-[#6B6B6B] text-xs mt-1">Compare quotes and select the best option</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setQuoteOpen(true)}
              className="w-full mt-4 py-3 bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#333333] transition-colors"
            >
              Post a Job
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobLeads;
