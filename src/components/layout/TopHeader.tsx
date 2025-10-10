import React, { useState } from "react";
import {
  Bell,
  User,
  Camera,
  Calendar,
  Wrench,
  Package,
  MessageSquare,
  Plus,
  Upload,
  FileText,
  Clock,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addNewProperty } from "@/lib/Api";
import { toast } from "sonner";
import Property from "../topbar/Property";
import Event from "../topbar/Event";
import DocsUploadDialog from "../docsUploadDialog";
import HomePack from "./homePack";

const TopHeader = () => {
  const [openForm, setOpenForm] = useState(false);

  return (
    <header className="sticky top-0 bg-white h-16 border-b border-gray-200 px-6 flex items-center justify-between z-30">
      <div className="font-bold text-xl text-black">Home⁺</div>

      {/* Quick Actions */}
      <div className="flex-1 max-w-4xl mx-8">
        <div className="flex items-center justify-center space-x-4">
          {/* Scan Doc Modal */}
          <button
            onClick={() => setOpenForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <Camera className="w-4 h-4 text-gray-600" strokeWidth={1} />
            <span className="text-sm font-medium text-gray-700">Scan Doc</span>
          </button>
          <DocsUploadDialog openForm={openForm} setOpenForm={setOpenForm} />
          {/* <Dialog>
            <DialogTrigger asChild>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Scan Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-2">Scan Your Document</h3>
                    <p className="text-gray-600 text-sm">
                      Take a photo of receipts, warranties, certificates, or any home-related documents to automatically organize them.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <Camera className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-700">Take Photo</span>
                  </div>
                  <div className="text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <Upload className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-700">Upload File</span>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button className="flex-1">Continue</Button>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog> */}
          {/* Task */}
          <Event />
          {/* Get Quotes Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <Wrench className="w-4 h-4 text-gray-600" strokeWidth={1} />
                <span className="text-sm font-medium text-gray-700">
                  Get Quotes
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Get Quotes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Service Required
                  </label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Plumbing</option>
                    <option>Electrical</option>
                    <option>Heating</option>
                    <option>Gardening</option>
                    <option>Cleaning</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Job Description
                  </label>
                  <textarea
                    placeholder="Describe what work needs to be done..."
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Budget Range
                    </label>
                    <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>£0-50</option>
                      <option>£50-100</option>
                      <option>£100-250</option>
                      <option>£250-500</option>
                      <option>£500+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Urgency
                    </label>
                    <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Emergency</option>
                      <option>This week</option>
                      <option>This month</option>
                      <option>Flexible</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button className="flex-1">Post Job</Button>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Home Pack Modal */}
          <HomePack setOpenForm={setOpenForm} />

          {/* Help Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <MessageSquare
                  className="w-4 h-4 text-gray-600"
                  strokeWidth={1}
                />
                <span className="text-sm font-medium text-gray-700">Help</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Get Help</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-2">
                      How can we help?
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Get support, browse our knowledge base, or connect with
                      our team.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 pt-4">
                  <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Live Chat
                      </div>
                      <div className="text-xs text-gray-500">
                        Get instant help from our support team
                      </div>
                    </div>
                  </button>
                  <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Knowledge Base
                      </div>
                      <div className="text-xs text-gray-500">
                        Browse guides and frequently asked questions
                      </div>
                    </div>
                  </button>
                  <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Book a Call
                      </div>
                      <div className="text-xs text-gray-500">
                        Schedule a one-on-one support session
                      </div>
                    </div>
                  </button>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button className="flex-1">Start Live Chat</Button>
                  <Button variant="outline" className="flex-1">
                    Browse FAQ
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Property />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Bell
            className="w-5 h-5 text-gray-400 hover:text-primary transition-colors cursor-pointer"
            strokeWidth={1}
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
        </div>
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" strokeWidth={1} />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
