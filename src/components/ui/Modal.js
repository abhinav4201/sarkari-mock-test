"use client";

import { X } from "lucide-react";
import { Fragment } from "react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "2xl",
}) {
  if (!isOpen) {
    return null;
  }

  // Map size prop to Tailwind CSS max-width classes
  const sizeClasses = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "7xl": "max-w-7xl",
  };

  return (
    <Fragment>
      {/* Backdrop Overlay */}
      <div
        className='fixed inset-0 bg-black/60 z-40 animate-in fade-in-0'
        onClick={onClose}
      ></div>

      {/* Modal Panel */}
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        <div
          className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 ${
            sizeClasses[size] || sizeClasses["2xl"]
          }`}
        >
          {/* Modal Header */}
          <div className='flex justify-between items-center p-6 border-b border-slate-200 flex-shrink-0'>
            <h2 className='text-xl font-bold text-slate-900 truncate pr-4'>
              {title}
            </h2>
            <button
              onClick={onClose}
              className='p-2 rounded-full hover:bg-slate-100 flex-shrink-0'
            >
              <X className='h-6 w-6 text-slate-600' />
            </button>
          </div>

          {/* Modal Content */}
          <div className='p-6 overflow-y-auto'>{children}</div>
        </div>
      </div>
    </Fragment>
  );
}
