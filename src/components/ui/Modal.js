"use client";

import { X } from "lucide-react";
import { Fragment } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <Fragment>
      {/* Backdrop Overlay */}
      <div className='fixed inset-0 bg-black/50 z-40' onClick={onClose}></div>

      {/* Modal Panel */}
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col'>
          {/* Modal Header */}
          <div className='flex justify-between items-center p-6 border-b border-slate-200 flex-shrink-0'>
            <h2 className='text-xl font-bold text-slate-900'>{title}</h2>
            <button
              onClick={onClose}
              className='p-2 rounded-full hover:bg-slate-100'
            >
              <X className='h-6 w-6 text-slate-600' />
            </button>
          </div>

          {/* Modal Content */}
          <div className='p-6 overflow-y-auto'>{children}</div>
        </div>
      </div>
    </Fragment>
  );
}
