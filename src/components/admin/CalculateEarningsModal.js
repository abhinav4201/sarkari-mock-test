// src/components/admin/CalculateEarningsModal.js

"use client";

import Modal from "../ui/Modal";
import { Calculator, AlertTriangle } from "lucide-react";

export default function CalculateEarningsModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Confirm Earnings Calculation'
    >
      <div className='p-6'>
        <div className='flex items-start gap-4'>
          <div className='mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10'>
            <Calculator
              className='h-6 w-6 text-indigo-600'
              aria-hidden='true'
            />
          </div>
          <div className='mt-0 text-left'>
            <h3 className='text-lg font-bold text-slate-900'>
              Run Earnings Calculation for All Creators?
            </h3>
            <div className='mt-2'>
              <p className='text-sm text-slate-600'>
                This action will read the latest test statistics and update the
                "Total Earnings" and "Pending Payout" amounts for every approved
                creator.
              </p>
              <p className='mt-2 text-sm text-slate-600'>
                This process is irreversible for the current calculation cycle.
                Are you sure you want to proceed?
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className='bg-slate-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-xl'>
        <button
          type='button'
          onClick={onClose}
          disabled={isLoading}
          className='w-full sm:w-auto inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'
        >
          Cancel
        </button>
        <button
          type='button'
          onClick={onConfirm}
          disabled={isLoading}
          className='w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400'
        >
          {isLoading ? "Calculating..." : "Confirm & Calculate"}
        </button>
      </div>
    </Modal>
  );
}
