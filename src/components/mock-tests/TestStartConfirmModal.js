"use client";

import Modal from "../ui/Modal";
import { AlertTriangle } from "lucide-react";

export default function TestStartConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  stats,
}) {
  if (!isOpen || !stats) {
    return null;
  }

  const { remaining, limit } = stats;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Confirm Your Attempt'>
      <div className='text-center p-6'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
          <AlertTriangle className='h-6 w-6 text-blue-600' />
        </div>
        <h3 className='mt-4 text-lg font-bold text-slate-900'>
          Confirm Test Attempt
        </h3>
        <div className='mt-2'>
          <p className='text-sm text-slate-700'>
            You have{" "}
            <strong className='text-indigo-600'>
              {remaining < 0 ? 0 : remaining}
            </strong>{" "}
            out of <strong>{limit}</strong> tests remaining for this month.
          </p>
          <p className='mt-2 text-sm text-slate-600'>
            Are you sure you want to proceed and use one attempt?
          </p>
        </div>
        <div className='mt-8 flex flex-col-reverse sm:flex-row-reverse gap-4'>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isLoading}
            className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 disabled:bg-green-400'
          >
            {isLoading ? "Starting..." : "Yes, Start Test"}
          </button>
          <button
            type='button'
            onClick={onClose}
            disabled={isLoading}
            className='w-full sm:w-auto inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50'
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
