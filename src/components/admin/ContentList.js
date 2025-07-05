"use client";

import ConfirmationModal from "@/components/ui/ConfirmationModal"; // <-- Import new modal
import { db } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const PAGE_SIZE = 5;

export default function ContentList({ initialContent, contentType, onEdit }) {
  const [content, setContent] = useState(initialContent);
  const [hasMore, setHasMore] = useState(initialContent.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  // State for the delete confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  const loadMore = async () => {
    toast.info("Load More functionality coming soon!");
  };

  // This function now just opens the confirmation modal
  const handleDeleteClick = (contentId) => {
    setDeletingContentId(contentId);
    setIsConfirmModalOpen(true);
  };

  // This function contains the actual deletion logic
  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete the document directly from the client
      await deleteDoc(doc(db, contentType, deletingContentId));

      toast.success("Item deleted!");
      setContent((prev) =>
        prev.filter((item) => item.id !== deletingContentId)
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsConfirmModalOpen(false);
      setDeletingContentId(null);
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title='Delete Content'
        message='Are you sure you want to permanently delete this item? This action cannot be undone.'
        confirmText='Delete'
        isLoading={isDeleting}
      />

      <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg mt-8 border border-slate-200'>
        <h2 className='text-xl font-semibold mb-6 text-slate-900'>
          Previously Added{" "}
          {contentType === "dailyVocabulary" ? "Vocabulary" : "GK"}
        </h2>
        <div className='space-y-4'>
          {content.length > 0 ? (
            content.map((item) => (
              <div
                key={item.id}
                className='p-4 border border-slate-200 rounded-lg'
              >
                <div className='flex justify-end gap-2'>
                  <button
                    onClick={() => onEdit(item)}
                    className='text-sm font-medium text-blue-600 hover:text-blue-800'
                  >
                    Edit
                  </button>
                  <span className='text-slate-300'>|</span>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className='text-sm font-medium text-red-600 hover:text-red-800'
                  >
                    Delete
                  </button>
                </div>

                {/* THIS IS THE CORRECTED CODE */}
                {contentType === "dailyVocabulary" ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2'>
                    <div
                      className='border rounded-md p-2 bg-slate-50'
                      dangerouslySetInnerHTML={{ __html: item.wordSvgCode }}
                    />
                    <div
                      className='border rounded-md p-2 bg-slate-50'
                      dangerouslySetInnerHTML={{ __html: item.meaningSvgCode }}
                    />
                  </div>
                ) : (
                  <div>
                    <p className='font-semibold text-slate-800'>
                      {item.category}
                    </p>
                    <div
                      className='mt-2 border rounded-md p-2 bg-slate-50'
                      dangerouslySetInnerHTML={{ __html: item.contentSvgCode }}
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className='text-center p-8 text-slate-700'>
              No content added yet.
            </p>
          )}
        </div>

        {hasMore && (
          <div className='text-center pt-6 mt-6 border-t border-slate-200'>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
