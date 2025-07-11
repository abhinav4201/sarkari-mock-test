"use client";

import { useState, useEffect } from "react";
import Modal from "../ui/Modal";

export default function LinkModal({
  isOpen,
  onClose,
  onSetLink,
  initialUrl = "",
}) {
  const [url, setUrl] = useState(initialUrl);

  // When the modal opens, pre-fill the input with the existing URL
  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
    }
  }, [isOpen, initialUrl]);

  const handleSave = () => {
    onSetLink(url);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Set Link URL'>
      <div className='p-6 space-y-4'>
        <div>
          <label
            htmlFor='link-url'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Enter URL
          </label>
          <input
            id='link-url'
            type='url'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='https://example.com'
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div className='flex justify-end gap-4'>
          <button
            type='button'
            onClick={onClose}
            className='px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            className='px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700'
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
