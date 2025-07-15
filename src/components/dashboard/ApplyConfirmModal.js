// src/components/dashboard/ApplyConfirmModal.js

"use client";

import Modal from "../ui/Modal";
import { PartyPopper, DollarSign, Award } from "lucide-react";

export default function ApplyConfirmModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Confirm Your Application'>
      <div className='text-center p-6'>
        <div className='flex justify-center items-center gap-4 mb-4'>
          <PartyPopper className='h-12 w-12 text-pink-500 transform -rotate-12' />
          <Award className='h-16 w-16 text-amber-500' />
          <DollarSign className='h-12 w-12 text-green-500 transform rotate-12' />
        </div>
        <h3 className='text-2xl font-bold text-slate-900'>
          You're Ready to Apply!
        </h3>
        <p className='mt-2 text-slate-600 max-w-md mx-auto'>
          You've met the eligibility criteria. Submitting your application will
          place your account in the queue for review. Are you ready to
          proceed?
        </p>
        <div className='mt-8 flex flex-col sm:flex-row-reverse gap-4'>
          <button
            onClick={onConfirm}
            className='w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold text-lg rounded-lg px-8 py-3 hover:shadow-xl transition-shadow'
          >
            Yes, Submit My Application!
          </button>
          <button
            onClick={onClose}
            className='w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-800 font-semibold rounded-lg hover:bg-slate-200'
          >
            Not Yet
          </button>
        </div>
      </div>
    </Modal>
  );
}
