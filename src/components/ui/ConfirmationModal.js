"use client";

import { X, AlertTriangle } from "lucide-react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  isLoading = false,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop Overlay */}
      <div className='fixed inset-0 bg-black/60 z-40' onClick={onClose}></div>

      {/* Modal Panel */}
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md'>
          <div className='p-6 text-center'>
            <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100'>
              <AlertTriangle
                className='h-6 w-6 text-red-600'
                aria-hidden='true'
              />
            </div>
            <h3 className='mt-4 text-lg font-bold text-slate-900'>{title}</h3>
            <div className='mt-2'>
              <p className='text-sm text-slate-700'>{message}</p>
            </div>
          </div>
          <div className='bg-slate-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 rounded-b-2xl'>
            <button
              type='button'
              onClick={onClose}
              disabled={isLoading}
              className='mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={onConfirm}
              disabled={isLoading}
              className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400'
            >
              {isLoading ? "Deleting..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
