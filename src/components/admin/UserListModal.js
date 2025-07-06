"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";

const PAGE_SIZE = 10;

export default function UserListModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchUsers = useCallback(
    async (initialLoad = false) => {
      if (!hasMore && !initialLoad) return;

      if (initialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const usersRef = collection(db, "users");
        const queryConstraints = [
          orderBy("name"), // Assuming users have a 'name' field
          limit(PAGE_SIZE),
        ];

        if (!initialLoad && lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }

        const q = query(usersRef, ...queryConstraints);
        const snapshot = await getDocs(q);
        const newUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers((prev) => (initialLoad ? newUsers : [...prev, ...newUsers]));
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(newUsers.length === PAGE_SIZE);
      } catch (error) {
        toast.error("Failed to load users.");
        console.error("User fetch error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [lastDoc, hasMore]
  );

  useEffect(() => {
    if (isOpen) {
      // Fetch users only when the modal is opened
      fetchUsers(true);
    } else {
      // Reset state when modal is closed
      setUsers([]);
      setLastDoc(null);
      setHasMore(true);
      setLoading(true);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Registered Users'>
      <div className='space-y-4'>
        {loading ? (
          <p>Loading users...</p>
        ) : users.length > 0 ? (
          users.map((user) => (
            <div key={user.id} className='p-3 border rounded-lg bg-slate-50'>
              <p className='font-semibold text-slate-900'>
                {user.name || "No Name Provided"}
              </p>
              <p className='text-sm text-indigo-600'>{user.email}</p>
            </div>
          ))
        ) : (
          <p className='font-semibold text-slate-900'>
            No registered users found.
          </p>
        )}

        {hasMore && !loading && (
          <div className='text-center pt-4'>
            <button
              onClick={() => fetchUsers(false)}
              disabled={loadingMore}
              className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
