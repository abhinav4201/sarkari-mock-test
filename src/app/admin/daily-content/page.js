"use client";

import { useState } from "react";
import DailyContentUploader from "@/components/admin/DailyContentUploader";
import ContentList from "@/components/admin/ContentList";
import Modal from "@/components/ui/Modal";
import EditContentForm from "@/components/admin/EditContentForm";
import { useRouter } from "next/navigation";

export default function DailyContentPage() {
  const [view, setView] = useState("vocabulary");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const router = useRouter();

  const handleOpenEditModal = (content) => {
    setEditingContent(content);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContent(null);
  };

  // After a successful edit, we can just close the modal.
  // The ContentList itself doesn't need to be re-rendered from here.
  const handleUpdateSuccess = () => {
    handleCloseModal();
    // We can optionally refresh the router if needed, but it may not be necessary
    // router.refresh();
  };

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Edit ${view === "vocabulary" ? "Vocabulary" : "GK"}`}
      >
        {editingContent && (
          <EditContentForm
            content={editingContent}
            contentType={view === "vocabulary" ? "dailyVocabulary" : "dailyGk"}
            onFormSubmit={handleUpdateSuccess}
          />
        )}
      </Modal>

      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          Manage Daily Content
        </h1>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'>
          <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
            <DailyContentUploader uploadType='vocabulary' />
          </div>
          <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
            <DailyContentUploader uploadType='gk' />
          </div>
        </div>

        <div className='mt-12'>
          <div className='flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4'>
            <h2 className='text-2xl font-bold text-slate-900'>
              Previously Added Content
            </h2>
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className='w-full sm:w-auto p-3 border text-slate-900 border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500'
            >
              <option value='vocabulary'>View Vocabulary</option>
              <option value='gk'>View General Knowledge</option>
            </select>
          </div>

          <div>
            {/* The ContentList component now fetches its own data */}
            {view === "vocabulary" && (
              <ContentList
                contentType='dailyVocabulary'
                onEdit={handleOpenEditModal}
              />
            )}
            {view === "gk" && (
              <ContentList contentType='dailyGk' onEdit={handleOpenEditModal} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
