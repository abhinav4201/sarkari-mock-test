"use client";

import Modal from "../ui/Modal";
import Link from "next/link";
import { CheckCircle, Clock, Ban } from "lucide-react";

// --- NEW: Helper function to format the submission reason nicely ---
const formatReason = (reason) => {
  switch (reason) {
    case "tab_switched":
      return {
        text: "Auto-Submitted (Tab Switched)",
        icon: <Ban className='h-3 w-3' />,
        color: "text-red-700 bg-red-100",
      };
    case "time_up":
      return {
        text: "Auto-Submitted (Time Up)",
        icon: <Clock className='h-3 w-3' />,
        color: "text-amber-700 bg-amber-100",
      };
    case "user_submitted":
    default:
      return {
        text: "Completed Manually",
        icon: <CheckCircle className='h-3 w-3' />,
        color: "text-green-700 bg-green-100",
      };
  }
};

export default function UserAttemptDetailsModal({ isOpen, onClose, details }) {
  if (!details) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Your Attempt History'>
      <div className='p-2'>
        <div className='mb-4 text-center border-b pb-3'>
          <p className='text-sm text-slate-600'>
            Showing all your attempts for
          </p>
          <p className='font-bold text-lg text-slate-800'>
            {details.testTitle}
          </p>
        </div>

        <div className='space-y-3 max-h-80 overflow-y-auto'>
          {details.allAttempts.map((attempt, index) => {
            // --- This logic now correctly points to the separate results pages ---
            const resultPath = attempt.isDynamic
              ? `/mock-tests/results/results-dynamic/${attempt.id}`
              : `/mock-tests/results/${attempt.id}`;

            // --- Get the formatted reason details ---
            const reasonDetails = formatReason(attempt.submissionReason);

            return (
              <div key={attempt.id} className='p-4 bg-slate-50 rounded-lg'>
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='font-semibold text-slate-800'>
                      Attempt {index + 1}
                    </p>
                    <p className='text-xs text-slate-500'>
                      {new Date(attempt.completedAt).toLocaleString()}
                    </p>
                  </div>
                  <p className='text-lg font-bold text-slate-900'>
                    {attempt.score} / {attempt.totalQuestions}
                  </p>
                </div>

                <div className='flex justify-between items-center mt-3 pt-3 border-t border-slate-200'>
                  {/* --- NEW: Display the submission reason with an icon and badge --- */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${reasonDetails.color}`}
                  >
                    {reasonDetails.icon}
                    {reasonDetails.text}
                  </div>
                  <Link
                    href={resultPath}
                    className='flex-shrink-0 px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-200 text-center'
                  >
                    View Result
                  </Link>
                </div>
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
