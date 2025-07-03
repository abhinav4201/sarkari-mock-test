"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 5;

// This component now receives an 'onEdit' function as a prop
export default function ContentList({ initialContent, contentType, onEdit }) {
  const [content, setContent] = useState(initialContent);
  const [hasMore, setHasMore] = useState(initialContent.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  const loadMore = async () => {
    toast.info("Load More functionality coming soon!");
  };

  const handleDelete = async (contentId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const loadingToast = toast.loading("Deleting item...");
    try {
      const res = await fetch(`/api/admin/daily-content/${contentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: contentType }),
      });
      if (!res.ok) throw new Error("Failed to delete item.");

      toast.success("Item deleted!", { id: loadingToast });
      setContent((prev) => prev.filter((item) => item.id !== contentId));
      router.refresh(); // Refresh the page to update counts if necessary
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    }
  };

  return (
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
                {/* THIS IS THE FIX: The edit button now calls the onEdit function passed from the parent page */}
                <button
                  onClick={() => onEdit(item)}
                  className='text-sm font-medium text-blue-600 hover:text-blue-800'
                >
                  Edit
                </button>
                <span className='text-slate-300'>|</span>
                <button
                  onClick={() => handleDelete(item.id)}
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
            onClick={loadMore}
            disabled={loadingMore}
            className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
