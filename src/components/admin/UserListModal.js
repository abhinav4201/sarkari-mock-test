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
import { Download } from "lucide-react";

const PAGE_SIZE = 10;

export default function UserListModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadCsv = async () => {
    toast.loading("Preparing download...", { id: "csv-download" });
    setIsDownloading(true);

    try {
      // This query fetches ALL users, ordered by name, ignoring pagination.
      const allUsersQuery = query(collection(db, "users"), orderBy("name"));
      const snapshot = await getDocs(allUsersQuery);

      if (snapshot.empty) {
        toast.error("No user data to download.", { id: "csv-download" });
        return;
      }

      const allUsers = snapshot.docs.map((doc) => doc.data());

      const headers = ["User ID", "Name", "Email"];
      const csvRows = [
        headers.join(","), // Header row
        ...allUsers.map((user) =>
          [
            `"${user.uid || ""}"`,
            `"${(user.name || "").replace(/"/g, '""')}"`, // Escape double quotes
            `"${user.email || ""}"`,
          ].join(",")
        ),
      ];

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `users_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started!", { id: "csv-download" });
    } catch (error) {
      toast.error("Failed to download CSV.", { id: "csv-download" });
      console.error("CSV download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Registered Users'>
      {/* Container for actions like download */}
      <div className='flex justify-end mb-4'>
        <button
          onClick={handleDownloadCsv}
          disabled={isDownloading}
          className='inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400'
        >
          <Download className='h-4 w-4 mr-2' />
          {isDownloading ? "Downloading..." : "Download as CSV"}
        </button>
      </div>

      <div className='space-y-4'>
        {loading ? (
          <p>Loading users...</p>
        ) : users.length > 0 ? (
          <div className='overflow-x-auto'>
            <table className='w-full text-left table-auto'>
              <thead className='bg-slate-100 border-b border-slate-200'>
                <tr>
                  <th className='p-4 text-sm font-semibold text-slate-800 tracking-wider'>
                    Name
                  </th>
                  <th className='p-4 text-sm font-semibold text-slate-800 tracking-wider'>
                    Email ID
                  </th>
                  <th className='p-4 text-sm font-semibold text-slate-800 tracking-wider'>
                    User ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className='border-b border-slate-100 hover:bg-slate-50'
                  >
                    <td className='p-4 align-top'>
                      <p className='font-semibold text-slate-900'>
                        {user.name || "No Name Provided"}
                      </p>
                    </td>
                    <td className='p-4 text-indigo-600 align-top'>
                      {user.email}
                    </td>
                    <td className='p-4 text-slate-600 font-mono text-xs align-top'>
                      {user.uid || "No UID Available"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
