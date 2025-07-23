"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function InactivityWarningModal({
  isOpen,
  onConfirm,
  onIdleSubmit,
}) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (isOpen) {
      setCountdown(30); // Reset countdown when modal opens
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onIdleSubmit(); // Auto-submit when countdown finishes
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, onIdleSubmit]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onConfirm} title='Are you still there?'>
      <div className='text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
          <AlertTriangle className='h-6 w-6 text-yellow-600' />
        </div>
        <div className='mt-3'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>
            Inactivity Detected
          </h3>
          <div className='mt-2 px-7 py-3'>
            <p className='text-sm text-gray-600'>
              You've been inactive for a while. The test will be submitted
              automatically in <span className='font-bold'>{countdown}</span>{" "}
              seconds if you don't respond.
            </p>
          </div>
        </div>
        <div className='mt-5'>
          <button
            type='button'
            onClick={onConfirm}
            className='w-full inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700'
          >
            I'm Still Here
          </button>
        </div>
      </div>
    </Modal>
  );
}
