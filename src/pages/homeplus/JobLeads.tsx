import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Edit,
  Filter,
  Plus,
  MapPin,
  Clock,
  PoundSterling,
  Star,
  ExternalLink,
  X
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const JobLeads = () => {
  const [compareMode, setCompareMode] = useState<Record<number, boolean>>({});
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const jobLeads = [
    {
      id: 1,
      title: "Boiler Service Required",
      description: "Annual boiler service and safety check for a 3-bedroom house",
      location: "Clapham, SW4",
      budget: "£80-120",
      postedDate: "2 days ago",
      status: "awaiting_quotes",
      messagesCount: 3,
      quotesCount: 3
    },
    {
      id: 2,
      title: "Kitchen Sink Repair",
      description: "Leaking kitchen sink pipe needs urgent repair",
      location: "Battersea, SW11",
      budget: "£50-100",
      postedDate: "1 day ago",
      status: "quotes_received",
      messagesCount: 1,
      quotesCount: 3
    },
    {
      id: 3,
      title: "Garden Maintenance",
      description: "Monthly garden maintenance including lawn mowing and hedge trimming",
      location: "Wandsworth, SW18",
      budget: "£40-60",
      postedDate: "3 days ago",
      status: "in_progress",
      messagesCount: 5,
      quotesCount: 3
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_quotes":
        return "bg-yellow-100 text-yellow-800";
      case "quotes_received":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "awaiting_quotes":
        return "Awaiting Quotes";
      case "quotes_received":
        return "Quotes Received";
      case "in_progress":
        return "In Progress";
      default:
        return "Unknown";
    }
  };

  const getQuotesForJob = (jobId: number) => {
    return [
      {
        id: 1,
        tradeName: "Swift Plumbing",
        rating: 4.8,
        reviews: 124,
        price: "£95",
        availability: "Available today",
        responseTime: "2 hours"
      },
      {
        id: 2,
        tradeName: "ProFix Services",
        rating: 4.6,
        reviews: 89,
        price: "£110",
        availability: "Available tomorrow",
        responseTime: "4 hours"
      },
      {
        id: 3,
        tradeName: "London Heating Co",
        rating: 4.9,
        reviews: 156,
        price: "£85",
        availability: "Available this week",
        responseTime: "1 hour"
      }
    ];
  };

  const toggleCompareMode = (jobId: number) => {
    setCompareMode(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
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
            <Button className="flex items-center space-x-2 px-4 py-2">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Post Job</span>
            </Button>
          </div>
        </div>

        {/* Job Leads Grid */}
        <div className="grid gap-6">
          {jobLeads.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-2">{job.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{job.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <PoundSterling className="w-4 h-4" />
                      <span>{job.budget}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{job.postedDate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-xs font-medium rounded-lg border ${getStatusColor(job.status)}`}>
                    {getStatusText(job.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
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
                </div>
                
                <Button 
                  variant="outline"
                  onClick={() => toggleCompareMode(job.id)}
                  className="text-sm bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                >
                  {compareMode[job.id] ? 'Hide quotes' : 'Compare quotes'}
                </Button>
              </div>

              {/* Quotes Section */}
              {job.quotesCount > 0 && (
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
                          {getQuotesForJob(job.id).map((quote) => (
                            <tr key={quote.id} className="border-b border-gray-100">
                              <td className="py-3 font-medium text-black">{quote.tradeName}</td>
                              <td className="py-3">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-gray-600">{quote.rating} ({quote.reviews})</span>
                                </div>
                              </td>
                              <td className="py-3 font-medium text-black">{quote.price}</td>
                              <td className="py-3 text-gray-600">{quote.availability}</td>
                              <td className="py-3 text-gray-600">{quote.responseTime}</td>
                               <td className="py-3">
                                 <Dialog>
                                   <DialogTrigger asChild>
                                     <button 
                                       className="flex items-center space-x-1 text-primary hover:underline"
                                       onClick={() => setSelectedQuote(quote)}
                                     >
                                       <ExternalLink className="w-3 h-3" />
                                       <span>View</span>
                                     </button>
                                   </DialogTrigger>
                                   <DialogContent className="sm:max-w-[500px]">
                                     <DialogHeader>
                                       <DialogTitle>Quote Details - {quote.tradeName}</DialogTitle>
                                     </DialogHeader>
                                     <div className="space-y-4 py-4">
                                       <div className="grid grid-cols-2 gap-4">
                                         <div>
                                           <label className="text-sm font-medium text-gray-600">Trade</label>
                                           <p className="text-lg font-semibold text-black">{quote.tradeName}</p>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-gray-600">Price</label>
                                           <p className="text-lg font-semibold text-black">{quote.price}</p>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-gray-600">Rating</label>
                                           <div className="flex items-center space-x-1">
                                             <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                             <span className="font-medium">{quote.rating}</span>
                                             <span className="text-gray-600">({quote.reviews} reviews)</span>
                                           </div>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-gray-600">Availability</label>
                                           <p className="font-medium text-black">{quote.availability}</p>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-gray-600">Response Time</label>
                                           <p className="font-medium text-black">{quote.responseTime}</p>
                                         </div>
                                       </div>
                                       <div className="pt-4 border-t">
                                         <h4 className="font-medium text-black mb-2">Service Details</h4>
                                         <p className="text-gray-600 text-sm">
                                           Professional {job.title.toLowerCase()} service including all necessary materials and labor. 
                                           Fully insured and certified. 12-month guarantee on all work completed.
                                         </p>
                                       </div>
                                       <div className="flex space-x-3 pt-4">
                                         <Button className="flex-1">
                                           Accept Quote
                                         </Button>
                                         <Button variant="outline" className="flex-1">
                                           Message Tradesperson
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
                      {getQuotesForJob(job.id).slice(0, 3).map((quote) => (
                        <div key={quote.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-black">{quote.tradeName}</h4>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{quote.rating}</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span className="font-medium text-black">{quote.price}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Available:</span>
                              <span>{quote.availability}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Response:</span>
                              <span>{quote.responseTime}</span>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <button 
                                className="w-full mt-3 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                                onClick={() => setSelectedQuote(quote)}
                              >
                                View Details
                              </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Quote Details - {quote.tradeName}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Trade</label>
                                    <p className="text-lg font-semibold text-black">{quote.tradeName}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Price</label>
                                    <p className="text-lg font-semibold text-black">{quote.price}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Rating</label>
                                    <div className="flex items-center space-x-1">
                                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                      <span className="font-medium">{quote.rating}</span>
                                      <span className="text-gray-600">({quote.reviews} reviews)</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Availability</label>
                                    <p className="font-medium text-black">{quote.availability}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Response Time</label>
                                    <p className="font-medium text-black">{quote.responseTime}</p>
                                  </div>
                                </div>
                                <div className="pt-4 border-t">
                                  <h4 className="font-medium text-black mb-2">Service Details</h4>
                                  <p className="text-gray-600 text-sm">
                                    Professional {job.title.toLowerCase()} service including all necessary materials and labor. 
                                    Fully insured and certified. 12-month guarantee on all work completed.
                                  </p>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                  <Button className="flex-1">
                                    Accept Quote
                                  </Button>
                                  <Button variant="outline" className="flex-1">
                                    Message Tradesperson
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
