"use client";

import { useState, useEffect } from "react";
import BlogPostCard from "./BlogPostCard";
// REMOVED: useAuth and useMemo are no longer needed here as filtering is removed.

const PAGE_SIZE = 6;

export default function BlogList({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- REMOVED: The useMemo hook for filtering posts is gone. ---
  // The component will now render all posts passed to it.
  // The BlogPostCard component itself will handle the premium lock.

  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const lastPost = posts[posts.length - 1];
      const cursor = lastPost ? new Date(lastPost.createdAt).toISOString() : "";
      const res = await fetch(`/api/posts?limit=${PAGE_SIZE}&cursor=${cursor}`);
      const newPosts = await res.json();
      if (Array.isArray(newPosts) && newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts]);
        if (newPosts.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {/* Now mapping directly over 'posts' instead of 'filteredPosts' */}
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
      {hasMore && (
        <div className='text-center mt-16'>
          <button
            onClick={loadMorePosts}
            disabled={loadingMore}
            className='px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all'
          >
            {loadingMore ? "Loading..." : "Load More Posts"}
          </button>
        </div>
      )}
    </div>
  );
}
