import React, { useState } from "react";
import { 
  ChevronDown,
  TrendingUp,
  PoundSterling,
  Shield,
  Target,
  Download,
  FileDown,
  Calculator,
  AlertTriangle,
  CheckCircle,
  BarChart,
  LineChart,
  Lightbulb,
  Filter,
  TrendingDown,
  Eye,
  ExternalLink,
  Clock,
  ArrowUpRight,
  Zap,
  Star,
  RefreshCw,
  PieChart,
  MoreHorizontal,
  Play
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Insights = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("Last 12 Months");
  const [selectedProperty, setSelectedProperty] = useState("23 Oakfield Rd, SW12 8JD");
  const [chartType, setChartType] = useState("bar");
  const [filterView, setFilterView] = useState("all");
  const [selectedJobModal, setSelectedJobModal] = useState(null);

  const properties = [
    "23 Oakfield Rd, SW12 8JD",
    "4 Maple Cottage, BN20 7HH"
  ];

  const maintenanceSpendData = [
    { month: "Jan", amount: 200, jobs: 2 },
    { month: "Feb", amount: 150, jobs: 1 },
    { month: "Mar", amount: 300, jobs: 3 },
    { month: "Apr", amount: 250, jobs: 2 },
    { month: "May", amount: 180, jobs: 2 },
    { month: "Jun", amount: 320, jobs: 4 },
    { month: "Jul", amount: 100, jobs: 1 },
    { month: "Aug", amount: 280, jobs: 2 },
    { month: "Sep", amount: 90, jobs: 1 },
    { month: "Oct", amount: 120, jobs: 2 },
    { month: "Nov", amount: 110, jobs: 1 },
    { month: "Dec", amount: 95, jobs: 1 }
  ];

  const recentJobs = [
    { date: "15 Nov", task: "Boiler Service", provider: "Swift Plumbing", cost: 95, rating: 5 },
    { date: "02 Nov", task: "Gutter Clean", provider: "ClearFlow", cost: 120, rating: 4 },
    { date: "18 Oct", task: "Window Cleaning", provider: "Crystal Clear", cost: 45, rating: 5 },
    { date: "05 Oct", task: "Garden Maintenance", provider: "GreenThumb", cost: 85, rating: 4 }
  ];

  const lifetimeStats = {
    totalJobs: 47,
    totalSpent: 8745,
    avgPerJob: 186,
    jobsThisYear: 12
  };

  const forecastData = {
    scheduledMaintenance: 890,
    likelyRepairs: 450,
    recommendedImprovements: 2800,
    total: 4140
  };

  const riskMatrix = [
    { item: "Boiler", likelihood: "high", impact: "high", x: 2, y: 2 },
    { item: "Roof", likelihood: "medium", impact: "medium", x: 1, y: 1 },
    { item: "Gutter", likelihood: "high", impact: "low", x: 2, y: 0 }
  ];

  const categoryBreakdown = [
    { category: "Boiler/Heating", amount: 420 },
    { category: "Electrical", amount: 235 },
    { category: "Plumbing", amount: 180 },
    { category: "Garden/External", amount: 210 },
    { category: "Certificates", amount: 120 },
    { category: "Emergency", amount: 80 }
  ];

  const certificates = [
    { name: "Gas Safety", status: "valid", expiry: "2025", icon: CheckCircle, color: "text-green-600" },
    { name: "EICR", status: "valid", expiry: "2026", icon: CheckCircle, color: "text-green-600" },
    { name: "EPC C", status: "valid", expiry: "2030", icon: CheckCircle, color: "text-green-600" },
    { name: "Insurance", status: "valid", expiry: "2024", icon: CheckCircle, color: "text-green-600" },
    { name: "Boiler", status: "valid", expiry: "2024", icon: CheckCircle, color: "text-green-600" }
  ];

  const upcomingRenewals = [
    { name: "Insurance", days: 45, urgency: "warning" },
    { name: "Boiler Service", days: 60, urgency: "warning" },
    { name: "MOT", days: 120, urgency: "normal" },
    { name: "Gas Safety", days: 280, urgency: "normal" }
  ];

  const riskAssessments = [
    { level: "High Risk", description: "Boiler age (8 years) - Plan replacement", color: "text-red-600" },
    { level: "Medium Risk", description: "No recent roof inspection - Schedule for spring", color: "text-orange-600" },
    { level: "Low Risk", description: "Minor gutter blockage - Clear before winter", color: "text-yellow-600" }
  ];

  const immediateActions = [
    { 
      title: "Book boiler service - overdue",
      cost: "£80-120",
      action: "Get 3 Quotes Now"
    },
    {
      title: "Renew home insurance", 
      cost: "£420/year",
      action: "Compare Providers"
    }
  ];

  const mediumTermActions = [
    {
      title: "Plan boiler replacement fund",
      cost: "£2,500-3,500", 
      action: "View Options"
    },
    {
      title: "Schedule roof inspection",
      cost: "£150",
      action: "Book for Spring"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header and Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-black">Insights</h1>
            <select 
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {properties.map((property, index) => (
                <option key={index} value={property}>{property}</option>
              ))}
            </select>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option>This Month</option>
              <option>This Year</option>
              <option>All Time</option>
            </select>
            <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Compare to: Neighbors</option>
              <option>Compare to: Last Year</option>
              <option>Compare to: UK Average</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
              <Download className="w-4 h-4" strokeWidth={1} />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        {/* KEY METRICS - 5 Cards */}
        <div className="grid grid-cols-5 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
                  TOTAL SAVED
                </div>
                <div className="text-2xl font-semibold text-black mb-2">£2,847</div>
                <div className="text-green-600 text-sm">vs £3,400 UK average</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
                  PROPERTY VALUE
                </div>
                <div className="text-2xl font-semibold text-black mb-2">£549,000</div>
                <div className="text-green-600 text-sm">+3.7% YoY</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
                  MAINTENANCE SPEND
                </div>
                <div className="text-2xl font-semibold text-black mb-2">£1,245</div>
                <div className="text-green-600 text-sm">-23% YoY</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
                  COMPLIANCE STATUS
                </div>
                <div className="text-2xl font-semibold text-black mb-2">95%</div>
                <div className="text-green-600 text-sm">All valid</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
                  HOME HEALTH SCORE
                </div>
                <div className="text-2xl font-semibold text-black mb-2">82/100</div>
                <div className="text-orange-600 text-sm">Amber</div>
              </div>
            </div>

            {/* FINANCIAL DASHBOARD */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-black">Financial Dashboard</h2>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setChartType("bar")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg ${chartType === "bar" ? 'bg-primary text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Bar Chart
                  </button>
                  <button 
                    onClick={() => setChartType("line")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg ${chartType === "line" ? 'bg-primary text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Line Graph
                  </button>
                  <button 
                    onClick={() => setChartType("pie")}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg ${chartType === "pie" ? 'bg-primary text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Pie Chart
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* Interactive Spend Chart */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Maintenance Spend Trend</h3>
                    <div className="flex space-x-2">
                      <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Compare Last Year</button>
                      <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Show Average</button>
                    </div>
                  </div>
                  
                  <div className="h-40 bg-gray-50 rounded-lg p-4 relative">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-500">
                      <span>£400</span>
                      <span>£300</span>
                      <span>£200</span>
                      <span>£100</span>
                      <span>£0</span>
                    </div>
                    
                    {/* Chart bars */}
                    <div className="ml-8 h-full flex items-end justify-between">
                      {maintenanceSpendData.map((data, index) => (
                        <div key={index} className="flex flex-col items-center group">
                          <div 
                            className="w-6 bg-primary rounded-t hover:bg-primary/80 transition-colors cursor-pointer"
                            style={{ height: `${(data.amount / 400) * 120}px` }}
                            title={`${data.month}: £${data.amount} (${data.jobs} jobs)`}
                          ></div>
                          <span className="text-xs text-gray-500 mt-1">{data.month.charAt(0)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* X-axis label */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 mt-2">
                      Months
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-4 text-xs">
                    <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Routine</button>
                    <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Emergency</button>
                    <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Improvements</button>
                  </div>
                </div>

                {/* Job History Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">Recent Jobs</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-sm">
                          View Full History
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Service History</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid gap-3">
                            {[
                              { date: "15 Nov 2024", task: "Boiler Service", provider: "Swift Plumbing", cost: 95, rating: 5, status: "Completed" },
                              { date: "02 Nov 2024", task: "Gutter Clean", provider: "ClearFlow", cost: 120, rating: 4, status: "Completed" },
                              { date: "18 Oct 2024", task: "Window Cleaning", provider: "Crystal Clear", cost: 45, rating: 5, status: "Completed" },
                              { date: "05 Oct 2024", task: "Garden Maintenance", provider: "GreenThumb", cost: 85, rating: 4, status: "Completed" },
                              { date: "22 Sep 2024", task: "Electrical Check", provider: "PowerSafe", cost: 150, rating: 5, status: "Completed" },
                              { date: "08 Sep 2024", task: "Plumbing Repair", provider: "AquaFlow", cost: 75, rating: 4, status: "Completed" },
                              { date: "25 Aug 2024", task: "Roof Inspection", provider: "TopRoof", cost: 200, rating: 5, status: "Completed" },
                              { date: "10 Aug 2024", task: "HVAC Service", provider: "CoolAir", cost: 180, rating: 4, status: "Completed" },
                            ].map((job, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <div className="text-sm font-medium text-black">{job.task}</div>
                                    <span className="px-2 py-1 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-200">
                                      {job.status}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600">{job.date} • {job.provider}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-black">£{job.cost}</div>
                                  <div className="flex items-center justify-end">
                                    {[...Array(job.rating)].map((_, i) => (
                                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" strokeWidth={1} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="space-y-3">
                    {recentJobs.map((job, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setSelectedJobModal(job)}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-black">{job.date} - {job.task}</div>
                          <div className="text-xs text-gray-600">{job.provider}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-black">£{job.cost}</div>
                          <div className="flex items-center">
                            {[...Array(job.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" strokeWidth={1} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Lifetime Stats</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-black font-medium">Total jobs: {lifetimeStats.totalJobs}</div>
                        <div className="text-black font-medium">Total spent: £{lifetimeStats.totalSpent.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-black font-medium">Avg per job: £{lifetimeStats.avgPerJob}</div>
                        <div className="text-black font-medium">Jobs this year: {lifetimeStats.jobsThisYear}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forecast Section */}
              <div className="mt-8 bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Next 12 Months Forecast</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Scheduled maintenance:</div>
                    <div className="text-black font-medium">£{forecastData.scheduledMaintenance}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Likely repairs:</div>
                    <div className="text-black font-medium">£{forecastData.likelyRepairs}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Recommended improvements:</div>
                    <div className="text-black font-medium">£{forecastData.recommendedImprovements}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total predicted:</div>
                    <div className="text-black font-bold">£{forecastData.total.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex space-x-3 mt-3">
                  <button className="px-3 py-1.5 bg-primary text-black text-xs font-medium rounded-lg hover:bg-primary/90">
                    Set Budget Alert
                  </button>
                  <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
                    Start Saving Plan
                  </button>
                </div>
              </div>
            </div>

            {/* PROPERTY INTELLIGENCE */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-black mb-6">Property Intelligence</h2>
              
              <div className="grid grid-cols-2 gap-8 mb-6">
                {/* Value Tracking */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-4">Value Trajectory</h3>
                  <div className="h-32 bg-gray-50 rounded-lg p-4 flex items-end justify-between">
                    <div className="flex flex-col items-center cursor-pointer hover:opacity-80">
                      <div className="w-3 h-8 bg-primary rounded" title="2020: £510k"></div>
                      <span className="text-xs text-gray-500 mt-1">2020</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer hover:opacity-80">
                      <div className="w-3 h-12 bg-primary rounded" title="2021: £525k"></div>
                      <span className="text-xs text-gray-500 mt-1">2021</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer hover:opacity-80">
                      <div className="w-3 h-16 bg-primary rounded" title="2022: £535k"></div>
                      <span className="text-xs text-gray-500 mt-1">2022</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer hover:opacity-80">
                      <div className="w-3 h-20 bg-primary rounded" title="2023: £540k"></div>
                      <span className="text-xs text-gray-500 mt-1">2023</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer hover:opacity-80">
                      <div className="w-3 h-24 bg-primary rounded" title="2024: £549k"></div>
                      <span className="text-xs text-gray-500 mt-1">2024</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">What-if Simulator</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">If I do X improvement:</span>
                        <span className="text-green-600">+£Y value</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">If I skip maintenance:</span>
                        <span className="text-red-600">-£Z value</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Improvement Opportunities */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-4">IMPROVEMENT OPPORTUNITIES WITH ROI</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-black">Loft insulation</div>
                          <div className="text-xs text-gray-600">Investment: £800</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">+£3,500</div>
                          <div className="text-xs text-gray-600">438% ROI</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-black">Smart heating</div>
                          <div className="text-xs text-gray-600">Investment: £1,200</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">+£2,800</div>
                          <div className="text-xs text-gray-600">233% ROI</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-black">Solar panels</div>
                          <div className="text-xs text-gray-600">Investment: £5,000</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">+£8,000</div>
                          <div className="text-xs text-gray-600">160% ROI</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Matrix */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-4">RISK MATRIX</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-2 h-32">
                    <div></div>
                    <div className="text-center text-xs text-gray-600">Low</div>
                    <div className="text-center text-xs text-gray-600">Med</div>
                    <div className="text-center text-xs text-gray-600">High</div>
                    
                    <div className="text-xs text-gray-600 flex items-center">High</div>
                    <div className="bg-green-100 rounded border-2 border-dashed border-green-300"></div>
                    <div className="bg-yellow-100 rounded border-2 border-dashed border-yellow-300"></div>
                    <div className="bg-red-100 rounded border-2 border-dashed border-red-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-red-800">Boiler</span>
                    </div>
                    
                    <div className="text-xs text-gray-600 flex items-center">Med</div>
                    <div className="bg-green-100 rounded border-2 border-dashed border-green-300"></div>
                    <div className="bg-yellow-100 rounded border-2 border-dashed border-yellow-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-yellow-800">Roof</span>
                    </div>
                    <div className="bg-red-100 rounded border-2 border-dashed border-red-300"></div>
                    
                    <div className="text-xs text-gray-600 flex items-center">Low</div>
                    <div className="bg-green-100 rounded border-2 border-dashed border-green-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-green-800">Gutter</span>
                    </div>
                    <div className="bg-yellow-100 rounded border-2 border-dashed border-yellow-300"></div>
                    <div className="bg-red-100 rounded border-2 border-dashed border-red-300"></div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-600">Impact →</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COMPLIANCE CENTER */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-black mb-6">Compliance Center</h2>
              
              {/* Visual Certificate Timeline */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-4">CERTIFICATE TIMELINE</h3>
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 h-2 bg-green-500 rounded-full" style={{ width: '25%' }}></div>
                  
                  <div className="flex justify-between mt-2">
                    <div className="text-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-1"></div>
                      <div className="text-xs text-gray-600">Insurance</div>
                      <div className="text-xs text-orange-600 font-medium">45 days</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-1"></div>
                      <div className="text-xs text-gray-600">Boiler</div>
                      <div className="text-xs text-orange-600 font-medium">60 days</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                      <div className="text-xs text-gray-600">Gas Safety</div>
                      <div className="text-xs text-gray-600">280 days</div>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                      <div className="text-xs text-gray-600">EICR</div>
                      <div className="text-xs text-gray-600">400 days</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* One-click Quote Requests */}
              <div className="grid grid-cols-3 gap-4">
                <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-left hover:bg-orange-100 transition-colors">
                  <div className="text-sm font-medium text-orange-800 mb-1">Insurance Renewal</div>
                  <div className="text-xs text-orange-600">Due in 45 days</div>
                  <div className="text-xs text-orange-800 font-medium mt-2">Get Quotes →</div>
                </button>
                <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-left hover:bg-orange-100 transition-colors">
                  <div className="text-sm font-medium text-orange-800 mb-1">Boiler Service</div>
                  <div className="text-xs text-orange-600">Due in 60 days</div>
                  <div className="text-xs text-orange-800 font-medium mt-2">Book Service →</div>
                </button>
                <button className="p-4 bg-green-50 border border-green-200 rounded-lg text-left hover:bg-green-100 transition-colors">
                  <div className="text-sm font-medium text-green-800 mb-1">All Compliant</div>
                  <div className="text-xs text-green-600">No urgent actions</div>
                  <div className="text-xs text-green-800 font-medium mt-2">View All →</div>
                </button>
              </div>
            </div>

            {/* AI RECOMMENDATIONS */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-black mb-6">AI Recommendations</h2>
              
              <div className="grid grid-cols-2 gap-8">
                {/* Prioritized Actions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-4">PRIORITIZED ACTIONS</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-800">HIGH PRIORITY</span>
                        <Clock className="w-4 h-4 text-red-600" strokeWidth={1} />
                      </div>
                      <div className="text-sm text-black">Book boiler service - overdue</div>
                      <div className="text-xs text-gray-600 mt-1">Cost: £80-120</div>
                      <button className="mt-2 px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700">
                        Get 3 Quotes Now
                      </button>
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-800">MEDIUM PRIORITY</span>
                        <AlertTriangle className="w-4 h-4 text-orange-600" strokeWidth={1} />
                      </div>
                      <div className="text-sm text-black">Renew home insurance</div>
                      <div className="text-xs text-gray-600 mt-1">Current: £420/year</div>
                      <button className="mt-2 px-3 py-1 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700">
                        Compare Providers
                      </button>
                    </div>
                  </div>
                </div>

                {/* Available Grants */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-4">AVAILABLE GRANTS & INCENTIVES</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Green Homes Grant</div>
                      <div className="text-xs text-gray-600 mt-1">Up to £5,000 for insulation</div>
                      <button className="mt-2 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700">
                        Apply Now
                      </button>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">Solar Panel Incentive</div>
                      <div className="text-xs text-gray-600 mt-1">Save £800/year on energy</div>
                      <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                        Get Quotes
                      </button>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-sm font-medium text-purple-800">Heat Pump Grant</div>
                      <div className="text-xs text-gray-600 mt-1">Up to £7,500 available</div>
                      <button className="mt-2 px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700">
                        Check Eligibility
                      </button>
                    </div>
                  </div>
                </div>
              </div>
        </div>

        {/* Job Detail Modal */}
        {selectedJobModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black">{selectedJobModal.task} - {selectedJobModal.date}</h3>
                <button 
                  onClick={() => setSelectedJobModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Provider:</span>
                  <span className="text-black ml-2">{selectedJobModal.provider}</span>
                </div>
                <div>
                  <span className="text-gray-600">Cost:</span>
                  <span className="text-black ml-2">£{selectedJobModal.cost}</span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="text-black ml-2">45 mins</span>
                </div>
                <div>
                  <span className="text-gray-600">Notes:</span>
                  <span className="text-black ml-2">All OK, next year needed</span>
                </div>
                <div>
                  <span className="text-gray-600">Documents:</span>
                  <button className="ml-2 text-primary hover:underline">[Service cert.pdf]</button>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">Rating:</span>
                  <div className="flex items-center ml-2">
                    {[...Array(selectedJobModal.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" strokeWidth={1} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
                  View Invoice
                </button>
                <button className="px-4 py-2 bg-primary text-black text-sm font-medium rounded-lg hover:bg-primary/90">
                  Book Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Insights;