"use client";

import Modal from "../ui/Modal";

// FIX: Add 'className' to the props to accept custom CSS classes
export default function AttemptDetailsModal({
  isOpen,
  onClose,
  details,
}) {
  if (!details) return null;

  return (
    // FIX: Pass the received className to the Modal component
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Attempt History'
    >
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

        <div className='space-y-3 max-h-80 overflow-y-auto'>
          {details.allAttempts.map((attempt, index) => (
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
              </div>
              <p className='text-lg font-bold text-slate-900'>
                Score: {attempt.score} / {attempt.totalQuestions}
              </p>
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
