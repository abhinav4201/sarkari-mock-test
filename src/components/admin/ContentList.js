"use client";

import ConfirmationModal from "@/components/ui/ConfirmationModal";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
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

  useEffect(() => {
    loadMoreContent(true);
  }, [contentType]);

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
    return (
      <div className='flex items-center justify-center p-12'>
        <div className='text-lg font-semibold text-slate-700'>
          Loading Content...
        </div>
      </div>
    );
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

      <div className='space-y-6'>
        {content.length > 0 ? (
          content.map((item) => (
            <div
              key={item.id}
              className='p-4 bg-white border border-slate-200 rounded-xl shadow-sm'
            >
              <div className='flex justify-between items-center pb-3 mb-3 border-b border-slate-200'>
                {/* Header Section */}
                <div className='font-bold text-slate-800'>
                  {contentType === "dailyVocabulary" ? (
                    <span className='text-indigo-600'>Vocabulary</span>
                  ) : (
                    <span className='text-emerald-600'>{item.category}</span>
                  )}
                </div>
                {/* Action Buttons */}
                <div className='flex items-center gap-2'>
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
              </div>

              {/* Content Section */}
              {contentType === "dailyVocabulary" ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-slate-600 mb-1'>
                      Word
                    </label>
                    <SvgDisplayer
                      svgCode={item.wordSvgCode}
                      className='h-auto min-h-[8rem] border rounded-lg bg-slate-50 flex items-center'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-slate-600 mb-1'>
                      Meaning
                    </label>
                    <SvgDisplayer
                      svgCode={item.meaningSvgCode}
                      className='h-auto min-h-[8rem] border rounded-lg bg-slate-50 flex items-center'
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className='block text-sm font-medium text-slate-600 mb-1'>
                    Content
                  </label>
                  <SvgDisplayer
                    svgCode={item.contentSvgCode}
                    className='h-auto min-h-[10rem] border rounded-lg bg-slate-50 flex items-center'
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className='text-center p-12 bg-white border border-dashed rounded-xl'>
            <p className='text-slate-700 font-medium'>
              No content has been added for this category yet.
            </p>
          </div>
        )}
      </div>

      {hasMore && (
        <div className='text-center pt-6 mt-6'>
          <button
            onClick={() => loadMoreContent(false)}
            disabled={loadingMore}
            className='px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
}
