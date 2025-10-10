import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Edit, Filter, Plus, MapPin, Clock, PoundSterling, Star, ExternalLink, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createJob, fetchLeads, modifyBid } from '@/lib/Api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Quote from '@/components/topbar/Quote';
import { toast } from 'sonner';

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
    onError: err => {},
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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-black">Job Leads</h1>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Filter</span>
            </button>
            <Button onClick={() => setQuoteOpen(true)} className="flex items-center space-x-2 px-4 py-2">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Post Job</span>
            </Button>
            <Quote open={quoteOpen} setOpen={setQuoteOpen} />
          </div>
        </div>

        {/* Job Leads Grid */}
        <div className="grid gap-6">
          {leads?.map(job => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2">{job.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{job.service}</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <PoundSterling className="w-4 h-4" />
                      <span>{job.value}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(job.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${getStatusColor(job?.isApproved)}`}>
                    {job?.isApproved ? 'Approved' : job?.bids?.length < 1 ? 'Waiting for quote' : 'Quote Received'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span></span>
                {/* <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span>{job.messagesCount}</span>
                  </button>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                </div> */}

                <Button
                  variant="outline"
                  onClick={() => toggleCompareMode(job.id)}
                  className="text-sm bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                >
                  {compareMode[job.id] ? 'Hide quotes' : 'Compare quotes'}
                </Button>
              </div>

              {/* Quotes Section */}
              {(job.bids?.length > 0 || job.quotesCount > 0) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {compareMode[job.id] ? (
                    // Comparison Table View
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-gray-600 font-medium">Trade</th>
                            <th className="text-left py-2 text-gray-600 font-medium">Rating</th>
                            <th className="text-left py-2 text-gray-600 font-medium">Price</th>
                            <th className="text-left py-2 text-gray-600 font-medium">Availability</th>
                            <th className="text-left py-2 text-gray-600 font-medium">Response</th>
                            <th className="text-left py-2 text-gray-600 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {job.bids?.map(bid => (
                            <tr key={bid.id} className="border-b border-gray-100">
                              <td className="py-3 font-medium text-black">{bid.bidder?.first_name || bid.bidder?.email || 'Trader'}</td>
                              <td className="py-3">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-gray-600">4</span>
                                </div>
                              </td>
                              <td className="py-3 font-medium text-black">{`£${bid.proposedValue}`}</td>
                              <td className="py-3 text-gray-600 capitalize">{bid.Available ?? 'N/A'}</td>
                              <td className="py-3 text-gray-600">{new Date(bid.created_at).toLocaleString()}</td>
                              <td className="py-3">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button
                                      className="flex items-center space-x-1 text-primary hover:underline"
                                      onClick={() => setSelectedQuote(bid)}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>View</span>
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
                                          <p className="font-medium capitalize text-black">{bid.Available}</p>
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    // Card View (Default)
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {job.bids?.slice(0, 3).map(bid => (
                        <div key={bid.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-black">{bid.bidder?.first_name || bid.bidder?.email}</h4>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              {/* {bid.bidder?.rating ?? '—'} */}
                              <span className="text-sm text-gray-600">4</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span className="font-medium text-black">{`£${bid.proposedValue}`}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Available:</span>
                              <span className=" capitalize">{bid.Available}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Placed:</span>
                              <span>{new Date(bid.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                className="w-full mt-3 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                                onClick={() => setSelectedQuote(bid)}
                              >
                                {bid.status == 'accepted' ? 'Accepted' : ' View Details'}
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
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobLeads;
