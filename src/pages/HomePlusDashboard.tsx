import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getEvents, uploadCover } from '@/lib/Api2';
import { listFilesWithMetadata } from '@/lib/Api';
import { toast } from 'sonner';
import { mapToDashEvents, sampleCalendarEvents, sampleTasks } from '@/components/dashboard/dashboardHelpers';
import WelcomeStats from '@/components/dashboard/WelcomeStats';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import UpcomingTasks from '@/components/dashboard/UpcomingTasks';
import RecentActivity from '@/components/dashboard/RecentActivity';
import SeasonalReminders from '@/components/dashboard/SeasonalReminders';
import PinnedDocuments from '@/components/dashboard/PinnedDocuments';

const HomePlusDashboard = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch cover image
  const {
    data: cover,
    isLoading: coverLoading,
    refetch,
  } = useQuery({
    queryKey: ['GetCover', user.id],
    queryFn: () => listFilesWithMetadata(`${user.id}/cover`),
    enabled: !!user.id,
  });

  // Fetch property data
  const { data, isLoading } = useQuery({
    queryKey: ['property'],
    queryFn: () => import('@/lib/Api2').then(mod => mod.getProperty()),
  });

  // Fetch events
  const { data: eventData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['event'],
    queryFn: getEvents,
  });

  // Cover upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadCover,
    onMutate: () => toast.loading('Uploading...', { id: 'upload-toast' }),
    onSuccess: () => {
      toast.dismiss('upload-toast');
      toast.success('Uploaded successfully!');
      setSelectedFile(null);
      refetch();
    },
    onError: () => {
      toast.dismiss('upload-toast');
      toast.error('Failed to upload document.');
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate({
        file,
        id: `${user?.id}/cover`,
        metadata: {},
      });
    }
  };

  // Prepare event data for child components
  const rawEvents = eventData?.data ?? eventData ?? [];
  const dashEvents =
    Array.isArray(rawEvents) && rawEvents.length > 0 ? mapToDashEvents(rawEvents) : sampleCalendarEvents;

  const displayTasks = eventData?.data?.length > 0 ? eventData.data : sampleTasks;
  const totalTaskCount = eventData?.data?.length || 0;

  const userName = user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : 'there';

  return (
    <DashboardLayout>
      <div className=" ">
        <main className=" space-y-6">
          <WelcomeStats userName={userName} eventCount={eventData?.data?.length || 0} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardCalendar events={dashEvents} />
            <UpcomingTasks tasks={displayTasks} totalCount={totalTaskCount} />
          </div>

          <SeasonalReminders />

          <PinnedDocuments />

          <RecentActivity />
        </main>
      </div>
    </DashboardLayout>
  );
};

export default HomePlusDashboard;
