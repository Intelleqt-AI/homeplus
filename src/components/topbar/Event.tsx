import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AddEvent from '@/components/event/AddEvent';

type EventMode = 'task' | 'reminder';

const Event = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventMode, setEventMode] = useState<EventMode>('task');

  const openDialog = (mode: EventMode) => {
    setEventMode(mode);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => openDialog('reminder')}
          className="flex items-center justify-center h-9 px-4 bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#333333] transition-colors"
        >
          Add Reminder
        </button>
        <button
          onClick={() => openDialog('task')}
          className="flex items-center justify-center h-9 px-4 bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#333333] transition-colors"
        >
          Add Task
        </button>
        <Link to="/dashboard/documents">
          <button className="flex items-center justify-center h-9 px-4 w-full bg-[#1A1A1A] text-white text-sm font-medium rounded-full hover:bg-[#333333] transition-colors">
            Add Document
          </button>
        </Link>
      </div>

      <AddEvent
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialMode={eventMode}
        hideTrigger
      />
    </>
  );
};

export default Event;
