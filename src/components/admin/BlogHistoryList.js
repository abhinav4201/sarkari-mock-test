"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Modal from "@/components/ui/Modal";
import EditPostForm from "./EditPostForm";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  startAfter,
  limit,
  getDocs,
  doc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

const PAGE_SIZE = 5;

export default function BlogHistoryList({ initialPosts }) {
  // This initial state mapping now robustly handles the date format.
  const [posts, setPosts] = useState(
    initialPosts.map((post) => ({
      ...post,
      // The initial posts from the server have createdAt as a number (milliseconds).
      // We convert it to a proper JS Date object here.
      createdAt: new Date(post.createdAt),
    }))
  );

  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const router = useRouter();

  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const postsRef = collection(db, "posts");
      const lastPost = posts[posts.length - 1];

      const q = query(
        postsRef,
        orderBy("createdAt", "desc"),
        // Use the Firestore Timestamp from the last post for the query cursor
        startAfter(Timestamp.fromDate(lastPost.createdAt)),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);

      // --- THIS IS THE FIX ---
      // When mapping the new documents, we immediately convert the Firestore
      // Timestamp to a standard JavaScript Date object using .toDate().
      const newPosts = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        };
      });

      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      if (newPosts.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (error) {
      toast.error("Failed to load more posts.");
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleteClick = (postId) => {
    setDeletingPostId(postId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "posts", deletingPostId));
      toast.success("Post deleted successfully!");
      setPosts((prev) => prev.filter((p) => p.id !== deletingPostId));
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsConfirmModalOpen(false);
      setDeletingPostId(null);
      setIsDeleting(false);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setEditingPost(null);
    router.refresh();
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title='Delete Post'
        message='Are you sure you want to permanently delete this blog post?'
        confirmText='Delete'
        isLoading={isDeleting}
      />
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title='Edit Blog Post'
      >
        {editingPost && (
          <EditPostForm post={editingPost} onFormSubmit={handleUpdateSuccess} />
        )}
      </Modal>

      <div className='space-y-4'>
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              className='p-4 border border-slate-200 rounded-lg bg-white'
            >
              <div className='flex flex-col sm:flex-row justify-between sm:items-start gap-4'>
                <div>
                  <h3 className='font-bold text-lg text-slate-900'>
                    {post.title}
                  </h3>
                  <p className='text-sm text-slate-900'>
                    Published on: {post.createdAt.toLocaleDateString()}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    target='_blank'
                    className='text-sm text-indigo-600 hover:underline'
                  >
                    View Post &rarr;
                  </Link>
                </div>
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <button
                    onClick={() => handleEdit(post)}
                    className='text-sm font-medium text-blue-600 hover:text-blue-800'
                  >
                    Edit
                  </button>
                  <span className='text-slate-300'>|</span>
                  <button
                    onClick={() => handleDeleteClick(post.id)}
                    className='text-sm font-medium text-red-600 hover:text-red-800'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className='text-center p-8 text-slate-700'>No blog posts found.</p>
        )}
      </div>

      {hasMore && (
        <div className='text-center mt-8'>
          <button
            onClick={loadMorePosts}
            disabled={loadingMore}
            className='px-6 py-2 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300'
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
}
