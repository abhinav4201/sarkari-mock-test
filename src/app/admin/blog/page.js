"use client";

import { useState, useEffect } from "react";
import BlogEditor from "@/components/admin/BlogEditor";
import BlogHistoryList from "@/components/admin/BlogHistoryList";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

// Helper function to fetch initial posts
async function getInitialPosts() {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("createdAt", "desc"), limit(5));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toMillis(),
    };
  });
}

export default function BlogManagementPage() {
  const [activeTab, setActiveTab] = useState("write"); // 'write' or 'history'
  const [initialPosts, setInitialPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      const posts = await getInitialPosts();
      setInitialPosts(posts);
      setLoading(false);
    }
    loadPosts();
  }, []);

  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>
        Blog Management
      </h1>

      {/* Tab Navigation */}
      <div className='border-b border-slate-200 mb-6'>
        <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
          <button
            onClick={() => setActiveTab("write")}
            className={`${
              activeTab === "write"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Write Blog
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`${
              activeTab === "history"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Blog History
          </button>
        </nav>
      </div>

      {/* Conditional Content */}
      <div>
        {activeTab === "write" && (
          <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
            <h2 className='text-xl font-semibold mb-6 text-slate-900'>
              Create New Post
            </h2>
            <BlogEditor />
          </div>
        )}
        {activeTab === "history" && (
          <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
            <h2 className='text-xl font-semibold mb-6 text-slate-900'>
              Previously Published Posts
            </h2>
            {loading ? (
              <p>Loading history...</p>
            ) : (
              <BlogHistoryList initialPosts={initialPosts} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
