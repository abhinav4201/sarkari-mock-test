"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from "firebase/firestore";
import BlogPostCard from "@/components/blog/BlogPostCard";
import ArchiveSidebar from "@/components/blog/ArchiveSidebar";
import {
  Newspaper,
  ArchiveRestore,
  BookOpen,
  Sun,
  Leaf,
  Sprout,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// New background component with a knowledge and nature theme
const KnowledgeBackground = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    {/* Large, faint background elements */}
    <Sprout className='absolute -bottom-20 -left-20 h-96 w-96 text-green-500/10 transform rotate-12' />
    <Sun className='absolute -top-24 -right-24 h-96 w-96 text-yellow-500/10 transform -rotate-12' />

    {/* Smaller, more distinct icons */}
    <BookOpen className='absolute top-20 left-1/4 h-20 w-20 text-blue-500/10 transform -rotate-6' />
    <Leaf className='absolute top-1/2 right-1/4 h-16 w-16 text-green-600/10 transform rotate-45' />
    <Leaf className='absolute bottom-1/4 left-10 h-24 w-24 text-green-400/10 transform -rotate-45' />
    <BookOpen className='absolute bottom-16 right-16 h-28 w-28 text-indigo-500/10' />
  </div>
);

// This component now filters the posts it receives
const PostListDisplay = ({ posts, user }) => {
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // If the post is not restricted, show it to everyone.
      if (!post.isRestricted) {
        return true;
      }
      // If the post is restricted, the user must be logged in.
      if (!user) {
        return false;
      }
      // If logged in, check if their ID is in the allowed list.
      return post.allowedUserIds?.includes(user.uid);
    });
  }, [posts, user]);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
      {filteredPosts.map((post) => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({
    type: "recent",
    title: "Recent Posts",
    icon: <Newspaper />,
  });
  const { user } = useAuth(); // Get the current user to pass down

  const fetchRecentPosts = useCallback(async () => {
    setLoading(true);
    setView({ type: "recent", title: "Recent Posts", icon: <Newspaper /> });
    try {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"), limit(10));
      const snapshot = await getDocs(q);
      const recentPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toMillis(),
      }));
      setPosts(recentPosts);
    } catch (error) {
      console.error("Failed to fetch recent posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArchivedPosts = useCallback(async ({ year, monthName }) => {
    setLoading(true);
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    setView({
      type: "archive",
      title: `${monthName} ${year}`,
      icon: <ArchiveRestore />,
    });

    try {
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59);

      const postsRef = collection(db, "posts");
      const q = query(
        postsRef,
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const archivedPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toMillis(),
      }));
      setPosts(archivedPosts);
    } catch (error) {
      console.error("Failed to fetch archived posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentPosts();
  }, [fetchRecentPosts]);

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-sky-100 overflow-hidden'>
      <KnowledgeBackground />
      <div className='relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='text-center mb-16'>
          <h1 className='text-4xl md:text-5xl font-extrabold text-slate-900'>
            Blog & Articles
          </h1>
          <p className='mt-4 text-lg text-slate-700'>
            Stay ahead with our latest insights, notes, and exam strategies.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12'>
          <div className='lg:col-span-8'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='flex items-center text-2xl font-bold text-slate-800'>
                <div className='mr-3 p-2 bg-white/60 backdrop-blur-sm text-indigo-600 rounded-lg'>
                  {view.icon}
                </div>
                {view.title}
              </h2>
              {view.type === "archive" && (
                <button
                  onClick={fetchRecentPosts}
                  className='text-sm font-semibold text-indigo-600 hover:underline'
                >
                  View Recent Posts
                </button>
              )}
            </div>

            {loading ? (
              <p>Loading posts...</p>
            ) : posts.length > 0 ? (
              <PostListDisplay posts={posts} user={user} />
            ) : (
              <p className='text-center p-12 bg-white/70 backdrop-blur-md rounded-lg shadow-md'>
                No posts found for this period.
              </p>
            )}
          </div>

          <div className='lg:col-span-4'>
            <div className='sticky top-24'>
              <ArchiveSidebar onMonthSelect={fetchArchivedPosts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
