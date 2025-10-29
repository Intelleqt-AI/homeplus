import React, { useState } from 'react';
import { Bell, User, Camera, Calendar, Wrench, Package, MessageSquare, Plus, Upload, FileText, Clock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addNewProperty } from '@/lib/Api';
import { toast } from 'sonner';
import Property from '../topbar/Property';
import Event from '../topbar/Event';
import DocsUploadDialog from '../docsUploadDialog';
import HomePack from './homePack';
import Quote from '../topbar/Quote';

const TopHeader = () => {
  const [openForm, setOpenForm] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <header className="sticky top-0 bg-white border-b border-[#e5e7eb80] px-6 py-8 flex items-center justify-between z-30">
      {/* <div className="font-bold text-xl text-black">Home⁺</div> */}

      {/* Quick Actions hidden */}
      <div className="flex-1 max-w-4xl mx-8 hidden">
        <div className="flex items-center justify-center space-x-4">
          {/* Scan Doc Modal */}
          <button
            onClick={() => setOpenForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Camera className="w-4 h-4 text-gray-600" strokeWidth={1} />
            <span className="text-sm font-medium text-gray-700">Scan Doc</span>
          </button>
          <DocsUploadDialog openForm={openForm} setOpenForm={setOpenForm} />
          {/* Task */}
          <Event />
          {/* Get Quotes Modal */}
          <button
            onClick={() => setQuoteOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Wrench className="w-4 h-4 text-gray-600" strokeWidth={1} />
            <span className="text-sm font-medium text-gray-700">Get Quotes</span>
          </button>
          <Quote open={quoteOpen} setOpen={setQuoteOpen} />

          {/* Home Pack Modal */}
          <HomePack setOpenForm={setOpenForm} />

          {/* Help Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <MessageSquare className="w-4 h-4 text-gray-600" strokeWidth={1} />
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
                    <h3 className="text-lg font-semibold text-black mb-2">How can we help?</h3>
                    <p className="text-gray-600 text-sm">Get support, browse our knowledge base, or connect with our team.</p>
                  </div>
                </div>
                <div className="grid gap-3 pt-4">
                  <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Live Chat</div>
                      <div className="text-xs text-gray-500">Get instant help from our support team</div>
                    </div>
                  </button>
                  <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Knowledge Base</div>
                      <div className="text-xs text-gray-500">Browse guides and frequently asked questions</div>
                    </div>
                  </button>
                  <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Book a Call</div>
                      <div className="text-xs text-gray-500">Schedule a one-on-one support session</div>
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
      <div className="">
        <p className="text-2xl mb-1">Good Afternoon 👋</p>
        <p className="text-sm">Here's what's happening in your home today.</p>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Bell className="w-5 h-5 text-[#4A5565] hover:text-[#2B7FFF] transition-colors cursor-pointer" strokeWidth={1} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#2B7FFF] rounded-full"></div>
        </div>
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" strokeWidth={1} />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
