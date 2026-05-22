import React, { useState } from 'react';
import DocsUploadDialog from '../docsUploadDialog';
import Quote from '../topbar/Quote';

const TopHeader = () => {
  const [openForm, setOpenForm] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <>
      <DocsUploadDialog openForm={openForm} setOpenForm={setOpenForm} />
      <Quote open={quoteOpen} setOpen={setQuoteOpen} />
    </>
  );
};

export default TopHeader;
