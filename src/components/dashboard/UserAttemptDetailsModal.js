"use client";

import Modal from "../ui/Modal";
import Link from "next/link";

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
          {details.allAttempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className='p-3 bg-slate-50 rounded-lg flex justify-between items-center'
            >
              <div>
                <p className='font-semibold text-slate-800'>
                  Attempt {index + 1}
                </p>
                <p className='text-xs text-slate-500'>
                  {new Date(attempt.completedAt).toLocaleDateString()}
                </p>
                <p className='text-slate-800 mt-1'>
                  Score:{" "}
                  <span className='font-extrabold text-indigo-600'>
                    {attempt.score}
                  </span>{" "}
                  / {attempt.totalQuestions}
                </p>
              </div>
              <Link
                href={`/mock-tests/results/${attempt.id}`}
                className='flex-shrink-0 px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-200 text-center'
              >
                View Result
              </Link>
            </div>
          ))}
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
