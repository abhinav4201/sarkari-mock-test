"use client";

import Modal from "../ui/Modal";
import Link from "next/link";
import { CheckCircle, Clock, Ban } from "lucide-react";

const formatReason = (reason) => {
  switch (reason) {
    case "tab_switched":
      return {
        text: "Tab Switched",
        icon: <Ban className='h-3 w-3' />,
        color: "text-red-700 bg-red-100",
      };
    case "time_up":
      return {
        text: "Time Up",
        icon: <Clock className='h-3 w-3' />,
        color: "text-amber-700 bg-amber-100",
      };
    case "user_submitted":
    default:
      return {
        text: "Completed",
        icon: <CheckCircle className='h-3 w-3' />,
        color: "text-green-700 bg-green-100",
      };
  }
};

export default function AttemptDetailsModal({ isOpen, onClose, details }) {
  if (!details) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Attempt History'>
      <div className='p-2'>
        <div className='mb-4 text-center border-b pb-3'>
          <p className='text-sm text-slate-600'>Showing all attempts by</p>
          <p className='font-bold text-lg text-indigo-600'>
            {details.userName}
          </p>
          <p className='text-sm text-slate-600'>for the test</p>
          <p className='font-bold text-lg text-slate-800'>
            {details.testTitle}
          </p>
        </div>

        {/* --- FIX: Removed max-h-80 and overflow-y-auto to prevent double scrollbar --- */}
        <div className='space-y-3'>
          {details.allAttempts.map((attempt, index) => {
            const reasonDetails = formatReason(attempt.submissionReason);

            return (
              <div
                key={index}
                className='p-3 bg-slate-50 rounded-lg flex justify-between items-center'
              >
                <div>
                  <p className='font-semibold text-slate-800'>
                    Attempt {index + 1}
                  </p>
                  <p className='text-xs text-slate-500'>
                    {new Date(attempt.completedAt.toDate()).toLocaleString()}
                  </p>
                  <div
                    className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${reasonDetails.color}`}
                  >
                    {reasonDetails.icon}
                    {reasonDetails.text}
                  </div>
                </div>
                <p className='text-lg font-bold text-slate-900'>
                  Score: {attempt.score} / {attempt.totalQuestions}
                </p>
              </div>
            );
          })}
        </div>

        <div className='mt-6 text-center'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
