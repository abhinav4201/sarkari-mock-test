"use client";

import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function FinalWarningModal({
  isOpen,
  onClose,
  onConfirmSubmit,
  onGoToQuestion, // This will handle both unanswered and review questions
  warningType, // 'unanswered' or 'review'
  count, // The number of questions for the warning
}) {
  const isReviewWarning = warningType === "review";

  const title = isReviewWarning
    ? "You have questions marked for review!"
    : "You have unanswered questions!";

  const message = isReviewWarning
    ? `You have marked ${count} question(s) for review. Are you sure you want to submit?`
    : `You have left ${count} question(s) unanswered. Are you sure you want to submit your test?`;

  const revisitButtonText = isReviewWarning
    ? "Revisit First Reviewed Question"
    : "Revisit First Unanswered Question";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Final Submission Warning'>
      <div className='text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
          <AlertTriangle className='h-6 w-6 text-yellow-600' />
        </div>
        <div className='mt-3'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>
            {title}
          </h3>
          <div className='mt-2 px-7 py-3'>
            <p className='text-sm text-gray-600'>{message}</p>
          </div>
        </div>
        <div className='mt-5 flex flex-col sm:flex-row-reverse gap-3'>
          <button
            type='button'
            onClick={onConfirmSubmit}
            className='w-full inline-flex justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700'
          >
            Yes, Submit Anyway
          </button>
          <button
            type='button'
            onClick={onGoToQuestion}
            className='w-full inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
          >
            {revisitButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
