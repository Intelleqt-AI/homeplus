import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Home, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Settings, 
  Bell,
  Plus,
  ArrowRight,
  Wrench,
  Shield,
  Clock,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const upcomingTasks = [
    { task: "Boiler annual service", due: "in 2 weeks", priority: "high", type: "maintenance" },
    { task: "Garden maintenance", due: "in 3 days", priority: "medium", type: "routine" },
    { task: "Gutter cleaning", due: "next month", priority: "low", type: "seasonal" }
  ];

  const recentActivity = [
    { action: "Completed smoke alarm test", date: "2 days ago", status: "completed" },
    { action: "Scheduled plumber visit", date: "1 week ago", status: "scheduled" },
    { action: "Updated home inventory", date: "2 weeks ago", status: "completed" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Home+</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-sm font-medium">
              JS
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, John! 👋</h1>
          <p className="text-foreground">Here's what's happening with your home today.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Tasks Due</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Completed</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Urgent</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Saved</p>
                  <p className="text-2xl font-bold">£1,240</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>Your scheduled maintenance and checks</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium">{task.task}</p>
                        <p className="text-sm text-foreground">{task.due}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                        {task.priority}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* EPC Rating */}
            <Card>
              <CardHeader>
                <CardTitle>EPC Rating</CardTitle>
                <CardDescription>Energy Performance Certificate for your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-primary text-primary-foreground text-2xl font-bold">
                      C
                    </div>
                    <div>
                      <p className="text-2xl font-bold">69</p>
                      <p className="text-sm text-muted-foreground">Current Rating</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      Valid until 2031
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-lg font-bold">B (81)</p>
                    <p className="text-xs text-muted-foreground">Potential Rating</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-lg font-bold">68 CO₂</p>
                    <p className="text-xs text-muted-foreground">Environmental Impact</p>
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Top Recommendations:</p>
                  <p className="text-xs text-muted-foreground">Install loft insulation • Upgrade boiler • Double glazing</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-12">
                  <Users className="h-4 w-4 mr-2" />
                  Find Trades
                </Button>
                <Button variant="outline" className="w-full justify-start h-12">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Service
                </Button>
                <Button variant="outline" className="w-full justify-start h-12">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Trade Pilot CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6 text-center space-y-4">
                <Wrench className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-semibold mb-2">Need a professional?</h3>
                  <p className="text-sm text-foreground mb-4">
                    Connect with top-rated local trades instantly
                  </p>
                </div>
                <Button className="w-full">
                  Browse Trade Pilot
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;