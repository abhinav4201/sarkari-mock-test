"use client";

import { useState, useEffect } from "react";
import BlogPostCard from "./BlogPostCard";

const PAGE_SIZE = 6;

export default function BlogList({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const lastPost = posts[posts.length - 1];
      const cursor = lastPost ? lastPost.createdAt : "";

      const res = await fetch(`/api/posts?cursor=${cursor}`);
      const newPosts = await res.json();

      if (Array.isArray(newPosts)) {
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
        {posts.map((post) => {
          // Re-create the Date object on the client
          const postWithDate = {
            ...post,
            createdAt: { toDate: () => new Date(post.createdAt) },
          };
          return <BlogPostCard key={post.id} post={postWithDate} />;
        })}
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
