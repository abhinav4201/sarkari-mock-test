"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  arrayUnion,
  doc,
} from "firebase/firestore";
import Papa from "papaparse";
import { Upload, FileDown } from "lucide-react";

// The component now accepts a 'contentType' prop ('mockTests' or 'posts')
export default function BulkAccessManager({ contentType, onUpdate }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => setCsvFile(e.target.files[0]);

  const downloadTemplate = () => {
    // FIX: The template now dynamically changes based on the selected content type.
    const isTests = contentType === "mockTests";
    const titleHeader = isTests ? "testTitle" : "postTitle";
    const exampleTitle = isTests
      ? "Sample Test Title 1"
      : "Sample Blog Post Title";

    const template = `userEmail,${titleHeader}\njohn.doe@example.com,${exampleTitle}`;
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `access_control_${contentType}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = () => {
    if (!csvFile) return toast.error("Please select a CSV file first.");
    setIsUploading(true);
    const loadingToast = toast.loading("Processing CSV file...");

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          const isTests = contentType === "mockTests";
          const titleHeader = isTests ? "testTitle" : "postTitle";

          if (!rows.length || !rows[0].userEmail || !rows[0][titleHeader]) {
            throw new Error(
              "Invalid CSV format. Please use the correct template."
            );
          }

          const userEmails = [...new Set(rows.map((row) => row.userEmail))];
          const contentTitles = [
            ...new Set(rows.map((row) => row[titleHeader])),
          ];

          const userQuery = query(
            collection(db, "users"),
            where("email", "in", userEmails)
          );
          // FIX: The query now uses the dynamic 'contentType' variable.
          const contentQuery = query(
            collection(db, contentType),
            where("title", "in", contentTitles)
          );

          const [userSnap, contentSnap] = await Promise.all([
            getDocs(userQuery),
            getDocs(contentQuery),
          ]);

          const usersMap = new Map(
            userSnap.docs.map((d) => [d.data().email, d.data().uid])
          );
          const contentMap = new Map(
            contentSnap.docs.map((d) => [
              d.data().title,
              { id: d.id, data: d.data() },
            ])
          );

          const batch = writeBatch(db);
          let updatesCount = 0;

          rows.forEach((row) => {
            const userId = usersMap.get(row.userEmail);
            const contentInfo = contentMap.get(row[titleHeader]);

            if (userId && contentInfo) {
              const contentRef = doc(db, contentType, contentInfo.id);

              const updatePayload = {
                allowedUserIds: arrayUnion(userId),
              };

              const isCurrentlyPublic =
                !contentInfo.data.allowedUserIds ||
                contentInfo.data.allowedUserIds.length === 0;

              if (isCurrentlyPublic) {
                updatePayload.isRestricted = true;
              }

              batch.update(contentRef, updatePayload);
              updatesCount++;
            }
          });

          if (updatesCount === 0) {
            throw new Error("No valid user/content pairs found in the CSV.");
          }

          await batch.commit();
          toast.success(
            `Successfully granted access for ${updatesCount} entries.`,
            { id: loadingToast }
          );
          if (onUpdate) onUpdate();
        } catch (error) {
          toast.error(`Error: ${error.message}`, { id: loadingToast });
        } finally {
          setIsUploading(false);
          setCsvFile(null);
          const fileInput = document.getElementById("bulk-access-csv-upload");
          if (fileInput) fileInput.value = "";
        }
      },
    });
  };

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border mt-8'>
      <h2 className='text-xl font-bold text-slate-900 mb-4'>
        3. Bulk Grant Access via CSV
      </h2>
      {/* FIX: The descriptive text now updates dynamically. */}
      <p className='text-sm text-slate-600 mb-4'>
        Grant access to multiple users for multiple{" "}
        {contentType === "mockTests" ? "tests" : "posts"} in a single upload.
        Ensure the user emails and content titles in the CSV are exact matches.
      </p>
      <div>
        <label
          htmlFor='bulk-access-csv-upload'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Upload CSV File
        </label>
        <input
          id='bulk-access-csv-upload'
          type='file'
          accept='.csv'
          onChange={handleFileChange}
          className='w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
        />
      </div>
      <div className='flex flex-col sm:flex-row gap-4 mt-4'>
        <button
          onClick={downloadTemplate}
          type='button'
          className='w-full inline-flex items-center justify-center px-4 py-2 text-sm bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
        >
          <FileDown className='h-4 w-4 mr-2' />
          Download Template
        </button>
        <button
          onClick={handleUpload}
          disabled={isUploading || !csvFile}
          className='w-full inline-flex items-center justify-center px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
        >
          <Upload className='h-4 w-4 mr-2' />
          {isUploading ? "Processing..." : "Upload & Grant Access"}
        </button>
      </div>
    </div>
  );
}
