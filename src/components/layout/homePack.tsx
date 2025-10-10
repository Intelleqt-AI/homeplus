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
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listFilesWithMetadata } from "@/lib/Api";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast } from "date-fns";

const getStatusColor = (statusDate: string | undefined) => {
  if (!statusDate) return "text-gray-600 bg-gray-50"; // no date
  if (isPast(new Date(statusDate))) return "text-yellow-600 bg-yellow-50"; // expired
  return "text-green-600 bg-green-50"; // still valid
};

const HomePack = ({ setOpenForm }) => {
  const { user } = useAuth();

  // Fetch files/folders
  const {
    data: docs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["GetAllDocs", user.id],
    queryFn: () => listFilesWithMetadata(user.id),
    enabled: !!user.id,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
          <Package className="w-4 h-4 text-gray-600" strokeWidth={1} />
          <span className="text-sm font-medium text-gray-700">Home Pack</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Your Home Pack</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black mb-2">
                Digital Home Pack
              </h3>
              <p className="text-gray-600 text-sm">
                Access all your property documents, certificates, warranties,
                and important information in one place.
              </p>
            </div>
          </div>
          <div className="grid gap-3 pt-4">
            {docs &&
              docs.length > 0 &&
              docs
                .filter((item) => item.id && item.name !== "cover")
                ?.map(({ id, name, metadata, publicUrl }) => {
                  return (
                    <div
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      key={id}>
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(
                          metadata?.metadata?.status
                        )}`}>
                        {metadata?.metadata?.status
                          ? isPast(new Date(metadata.metadata.status))
                            ? "Action required"
                            : `Valid until ${format(
                                new Date(metadata.metadata.status),
                                "yyyy"
                              )}`
                          : "—"}
                      </span>
                      {/* <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Complete
              </span> */}
                    </div>
                  );
                })}

            {/* <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Property Deeds
                </span>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Complete
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  EPC Certificate
                </span>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Complete
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Gas Safety Certificate
                </span>
              </div>
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Expires Soon
              </span>
            </div> */}
          </div>
          <div className="flex space-x-3 pt-4">
            <Link to="/dashboard/documents" className="flex-1">
              <Button className="w-full">View All Documents</Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpenForm(true)}>
              Add Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HomePack;
