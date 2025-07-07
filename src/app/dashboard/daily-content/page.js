"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";
import toast from "react-hot-toast";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import BackButton from "@/components/BackButton";

const PAGE_SIZE = 10;

function DailyContent() {
  const searchParams = useSearchParams();
  const contentType = searchParams.get("type") || "gk";

  const [content, setContent] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const collectionName =
    contentType === "vocabulary" ? "dailyVocabulary" : "dailyGk";
  const pageTitle =
    contentType === "vocabulary"
      ? "Daily Vocabulary"
      : "Daily General Knowledge";

  const fetchContent = useCallback(
    async (initialLoad = false) => {
      if (!hasMore && !initialLoad) return;
      initialLoad ? setLoading(true) : setLoadingMore(true);

      try {
        const contentRef = collection(db, collectionName);
        const queryConstraints = [
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];

        if (!initialLoad && lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }

        const q = query(contentRef, ...queryConstraints);
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
        toast.error(`Failed to load ${pageTitle}.`);
        console.error("Content fetch error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [collectionName, lastDoc, hasMore, pageTitle]
  );

  useEffect(() => {
    setContent([]);
    setLastDoc(null);
    setHasMore(true);
    fetchContent(true);
  }, [contentType]);

  return (
    <div className='bg-slate-100 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-8'>
            <BackButton />
            <h1 className='mt-4 text-4xl font-extrabold text-slate-900'>
              {pageTitle} History
            </h1>
            <p className='mt-2 text-lg text-slate-600'>
              Browse all previously posted content.
            </p>
          </div>

          {loading ? (
            <p className='text-center p-8'>Loading content...</p>
          ) : content.length > 0 ? (
            <div className='space-y-6'>
              {content.map((item) => (
                <div
                  key={item.id}
                  className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'
                >
                  {/* NEW: Date display added here */}
                  <div className='border-b border-slate-200 pb-3 mb-4'>
                    <p className='text-sm font-semibold text-indigo-600'>
                      Posted on:{" "}
                      {item.createdAt
                        ? new Date(item.createdAt.toDate()).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>

                  {contentType === "vocabulary" ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <h4 className='font-semibold text-slate-600 mb-2'>
                          Word
                        </h4>
                        <SvgDisplayer
                          svgCode={item.wordSvgCode}
                          className='h-28 bg-slate-50 rounded-lg p-2'
                        />
                      </div>
                      <div>
                        <h4 className='font-semibold text-slate-600 mb-2'>
                          Meaning
                        </h4>
                        <SvgDisplayer
                          svgCode={item.meaningSvgCode}
                          className='h-28 bg-slate-50 rounded-lg p-2'
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className='font-semibold text-slate-600 mb-2'>
                        Topic:{" "}
                        <span className='text-indigo-600'>{item.category}</span>
                      </h4>
                      <SvgDisplayer
                        svgCode={item.contentSvgCode}
                        className='h-auto min-h-[8rem] bg-slate-50 rounded-lg p-2'
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className='text-center p-12 bg-white rounded-xl shadow-md'>
              No content found for this category.
            </p>
          )}

          {hasMore && !loading && (
            <div className='text-center mt-12'>
              <button
                onClick={() => fetchContent(false)}
                disabled={loadingMore}
                className='px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DailyContentPage() {
  return (
    <Suspense fallback={<div className='text-center p-8'>Loading Page...</div>}>
      <DailyContent />
    </Suspense>
  );
}
