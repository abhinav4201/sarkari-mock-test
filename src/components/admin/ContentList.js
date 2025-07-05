"use client";

import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const PAGE_SIZE = 5;

export default function ContentList({ initialContent, contentType, onEdit }) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  // State for the delete confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const loadMoreContent = useCallback(
    async (initialLoad = false) => {
      if (!hasMore && !initialLoad) return;
      if (initialLoad) setLoading(true);
      else setLoadingMore(true);

      try {
        const contentRef = collection(db, contentType);
        let q;
        const queryConstraints = [
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];

        if (!initialLoad && lastDoc) {
          q = query(contentRef, ...queryConstraints, startAfter(lastDoc));
        } else {
          q = query(contentRef, ...queryConstraints);
        }

        const snapshot = await getDocs(q);
        const newContent = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setContent((prev) =>
          initialLoad ? newContent : [...prev, ...newContent]
        );
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(newContent.length === PAGE_SIZE);
      } catch (error) {
        toast.error("Failed to load content.");
        console.error("Failed to load content", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [contentType, lastDoc, hasMore]
  );

  // Initial data fetch
  useEffect(() => {
    loadMoreContent(true);
  }, [contentType]); // Re-fetch if the content type changes (e.g., switching tabs)

  const handleDeleteClick = (contentId) => {
    setDeletingContentId(contentId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
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

  if (loading) {
    return <div className='text-center p-8'>Loading content...</div>;
  }

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title='Delete Content'
        message='Are you sure you want to permanently delete this item?'
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
              onClick={() => loadMoreContent(false)}
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
