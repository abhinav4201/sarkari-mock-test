// src/components/admin/UserTestsDetailModal.js

"use client";

import Modal from "../ui/Modal";
import { Eye, Users } from "lucide-react";

export default function UserTestsDetailModal({ isOpen, onClose, userStats }) {
  if (!userStats) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tests by ${userStats.userName}`}
      size='4xl'
    >
      <div className='space-y-3'>
        {userStats.tests.map((test) => (
          // --- THIS IS THE ONLY CHANGE ---
          // The key is now correctly set to test.testId
          <div key={test.testId} className='p-4 bg-slate-50 rounded-lg border'>
            <h4 className='font-semibold text-slate-800'>{test.title}</h4>
            <div className='flex items-center gap-6 mt-2 text-sm'>
              <div className='flex items-center gap-1.5 text-slate-600'>
                <Eye className='h-4 w-4' />
                <span>{test.impressionCount || 0} Impressions</span>
              </div>
              <div className='flex items-center gap-1.5 text-slate-600'>
                <Users className='h-4 w-4' />
                <span>{test.uniqueTakers?.length || 0} Unique Takers</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
