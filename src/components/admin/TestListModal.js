"use client";

import { useState, useEffect, useCallback } from "react";
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
import Modal from "../ui/Modal";
import { Download } from "lucide-react";

const PAGE_SIZE = 10;

export default function TestListModal({ isOpen, onClose }) {
  const [tests, setTests] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchTests = useCallback(
    async (initialLoad = false) => {
      if (!hasMore && !initialLoad) return;
      initialLoad ? setLoading(true) : setLoadingMore(true);

      try {
        const testsRef = collection(db, "mockTests");
        const queryConstraints = [
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];

        if (!initialLoad && lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }

        const q = query(testsRef, ...queryConstraints);
        const snapshot = await getDocs(q);
        const newTests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTests((prev) => (initialLoad ? newTests : [...prev, ...newTests]));
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(newTests.length === PAGE_SIZE);
      } catch (error) {
        toast.error("Failed to load mock tests.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [lastDoc, hasMore]
  );

  useEffect(() => {
    if (isOpen) {
      fetchTests(true);
    } else {
      setTests([]);
      setLastDoc(null);
      setHasMore(true);
      setLoading(true);
    }
  }, [isOpen]);

  const handleDownloadCsv = async () => {
    toast.loading("Preparing download...", { id: "csv-download" });
    setIsDownloading(true);

    try {
      const allTestsQuery = query(
        collection(db, "mockTests"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(allTestsQuery);
      const allTests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (snapshot.empty) {
        toast.error("No test data to download.", { id: "csv-download" });
        return;
      }

      // FIX: Added "Test ID" as the first column header
      const headers = [
        "Test ID",
        "Title",
        "Subject",
        "Topic",
        "Question Count",
        "Created At",
      ];
      const csvRows = [
        headers.join(","),
        ...allTests.map((test) => {
          const createdAt = test.createdAt?.toDate
            ? new Date(test.createdAt.toDate()).toLocaleString()
            : "N/A";
          return [
            `"${test.id}"`, // FIX: Added the test ID to the CSV row
            `"${(test.title || "").replace(/"/g, '""')}"`,
            `"${(test.subject || "").replace(/"/g, '""')}"`,
            `"${(test.topic || "").replace(/"/g, '""')}"`,
            test.questionCount || 0,
            `"${createdAt}"`,
          ].join(",");
        }),
      ];

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `mock_tests_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started!", { id: "csv-download" });
    } catch (error) {
      toast.error("Failed to download CSV.", { id: "csv-download" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='All Mock Tests'>
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

      <div className='overflow-x-auto'>
        {loading ? (
          <p>Loading tests...</p>
        ) : tests.length > 0 ? (
          <table className='w-full text-left table-auto'>
            <thead className='bg-slate-100 border-b border-slate-200'>
              <tr>
                {/* FIX: New table header for the Test ID */}
                <th className='p-4 text-sm font-semibold text-slate-800'>
                  Test ID
                </th>
                <th className='p-4 text-sm font-semibold text-slate-800'>
                  Title
                </th>
                <th className='p-4 text-sm font-semibold text-slate-800'>
                  Subject
                </th>
                <th className='p-4 text-sm font-semibold text-slate-800'>
                  Questions
                </th>
                <th className='p-4 text-sm font-semibold text-slate-800'>
                  Date Created
                </th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr
                  key={test.id}
                  className='border-b border-slate-100 hover:bg-slate-50'
                >
                  {/* FIX: New table cell to display the Test ID */}
                  <td className='p-4 font-mono text-xs text-slate-600 align-top'>
                    {test.id}
                  </td>
                  <td className='p-4 font-semibold text-slate-900 align-top'>
                    {test.title}
                  </td>
                  <td className='p-4 text-slate-700 align-top'>
                    {test.subject}
                  </td>
                  <td className='p-4 text-slate-700 align-top'>
                    {test.questionCount || 0}
                  </td>
                  <td className='p-4 text-slate-600 text-sm align-top'>
                    {test.createdAt?.toDate
                      ? new Date(test.createdAt.toDate()).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No mock tests found.</p>
        )}
      </div>

      {hasMore && !loading && (
        <div className='text-center pt-6 mt-4 border-t'>
          <button
            onClick={() => fetchTests(false)}
            disabled={loadingMore}
            className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </Modal>
  );
}
