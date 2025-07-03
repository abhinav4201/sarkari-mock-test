"use client";

import { useState, useEffect, useCallback } from "react";
import DailyContentUploader from "@/components/admin/DailyContentUploader";
import ContentList from "@/components/admin/ContentList";
import Modal from "@/components/ui/Modal";
import EditContentForm from "@/components/admin/EditContentForm";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

// Helper function remains outside the component for clarity
async function getInitialContent(collectionName) {
  const contentRef = collection(db, collectionName);
  const q = query(contentRef, orderBy("createdAt", "desc"), limit(5));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? data.createdAt.toMillis() : null,
    };
  });
}

export default function DailyContentPage() {
  const [view, setView] = useState("vocabulary"); // 'vocabulary' or 'gk'
  const [vocab, setVocab] = useState([]);
  const [gk, setGk] = useState([]);
  const [loading, setLoading] = useState(true);

  // State to manage the Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);

  // Use useCallback to memoize the data loading function
  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [vocabData, gkData] = await Promise.all([
        getInitialContent("dailyVocabulary"),
        getInitialContent("dailyGk"),
      ]);
      setVocab(vocabData);
      setGk(gkData);
    } catch (error) {
      console.error("Failed to load content:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load content on initial render
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Function to open the modal with the correct item data
  const handleOpenEditModal = (content) => {
    setEditingContent(content);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContent(null);
  };

  // This function is called after a successful edit to refresh the data
  const handleUpdateSuccess = () => {
    handleCloseModal();
    loadContent(); // Refetch the data to show the changes
  };

  return (
    <>
      {/* The Modal for editing content */}
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

          {loading ? (
            <div className='text-center p-8'>Loading content...</div>
          ) : (
            <div>
              {view === "vocabulary" && (
                <ContentList
                  initialContent={vocab}
                  contentType='dailyVocabulary'
                  onEdit={handleOpenEditModal}
                />
              )}
              {view === "gk" && (
                <ContentList
                  initialContent={gk}
                  contentType='dailyGk'
                  onEdit={handleOpenEditModal}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
