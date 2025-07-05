"use client";

import { useState } from "react";
import BlogPostCard from "./BlogPostCard";

const PAGE_SIZE = 6;

export default function BlogList({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  // FIX: Implemented "Load More" functionality
  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const lastPost = posts[posts.length - 1];
      // The cursor should be the timestamp of the last post
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
      console.error("Failed to load more posts", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {posts.map((post) => (
          // The card now handles display logic, including the SVG
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
