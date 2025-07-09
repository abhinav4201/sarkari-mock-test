"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
} from "firebase/firestore";
import toast from "react-hot-toast";
import QuestionBankList from "@/components/admin/QuestionBankList";
import AddQuestionBankForm from "@/components/admin/AddQuestionBankForm";
import BulkUploadToBank from "@/components/admin/BulkUploadToBank";
import { List, Plus, UploadCloud } from "lucide-react";

const PAGE_SIZE = 10; // Number of questions to load at a time

export default function QuestionBankPage() {
  // State for the active tab
  const [activeTab, setActiveTab] = useState("list"); // 'list', 'single', 'bulk'

  // State for question data and pagination
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchQuestions = useCallback(
    async (loadMore = false) => {
      if (!loadMore) {
        setIsLoading(true);
        setQuestions([]);
        setLastDoc(null);
        setHasMore(true);
      } else {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
      }

      try {
        const queryConstraints = [
          collection(db, "questionBank"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];

        if (loadMore && lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }

        const q = query(...queryConstraints);
        const snapshot = await getDocs(q);

        const fetchedQuestions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setQuestions((prev) =>
          loadMore ? [...prev, ...fetchedQuestions] : fetchedQuestions
        );
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(fetchedQuestions.length === PAGE_SIZE);
      } catch (error) {
        toast.error("Failed to fetch questions from the bank.");
        console.error("Error fetching question bank:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [lastDoc, hasMore, isLoadingMore]
  );

  useEffect(() => {
    // Fetch questions only when the 'list' tab is active
    if (activeTab === "list") {
      fetchQuestions();
    }
  }, [activeTab]); // Removed fetchQuestions from dependency array to avoid re-fetching on every render

  // This function is called after a successful upload
  const handleQuestionAdded = () => {
    // Switch back to the list tab to show the updated list
    setActiveTab("list");
    // Trigger a full refresh of the list from the start
    fetchQuestions(false);
  };

  const TabButton = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-3 font-semibold text-sm rounded-lg transition-colors ${
        activeTab === tabName
          ? "bg-indigo-600 text-white shadow-md"
          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>Question Bank</h1>
      <p className='mb-8 text-slate-600 max-w-4xl'>
        Manage the central repository of questions. Use the tabs below to view
        all questions, add a single question, or perform a bulk upload using a
        CSV file.
      </p>

      {/* Tab Navigation */}
      <div className='flex flex-col sm:flex-row gap-2 mb-8'>
        <TabButton
          tabName='list'
          label='All Questions'
          icon={<List size={16} />}
        />
        <TabButton
          tabName='single'
          label='Add Single Question'
          icon={<Plus size={16} />}
        />
        <TabButton
          tabName='bulk'
          label='Bulk Upload'
          icon={<UploadCloud size={16} />}
        />
      </div>

      {/* Tab Content */}
      <div className='bg-white p-6 rounded-2xl shadow-lg border'>
        {activeTab === "list" && (
          <div>
            <h2 className='text-xl font-bold text-slate-900 mb-4'>
              All Questions in Bank
            </h2>
            {isLoading ? (
              <p className='text-center p-8 text-slate-600'>
                Loading questions...
              </p>
            ) : (
              <QuestionBankList
                questions={questions}
                onDataChange={handleQuestionAdded}
                loadMore={() => fetchQuestions(true)}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
              />
            )}
          </div>
        )}

        {activeTab === "single" && (
          <div>
            <h2 className='text-xl font-bold text-slate-900 mb-4'>
              Add a Single Question
            </h2>
            <AddQuestionBankForm onUploadSuccess={handleQuestionAdded} />
          </div>
        )}

        {activeTab === "bulk" && (
          <div>
            <h2 className='text-xl font-bold text-slate-900 mb-4'>
              Bulk Upload Questions via CSV
            </h2>
            <BulkUploadToBank onUploadSuccess={handleQuestionAdded} />
          </div>
        )}
      </div>
    </div>
  );
}
