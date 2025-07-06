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

export default function BulkAccessManager({ onUpdate }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => setCsvFile(e.target.files[0]);

  const downloadTemplate = () => {
    const template =
      "userEmail,testTitle\njohn.doe@example.com,Sample Test Title 1\njane.doe@example.com,Another Test Title";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "access_control_template.csv");
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
          if (!rows.length || !rows[0].userEmail || !rows[0].testTitle) {
            throw new Error("Invalid CSV format. Please use the template.");
          }

          // Step 1: Find all unique user emails and test titles from the CSV
          const userEmails = [...new Set(rows.map((row) => row.userEmail))];
          const testTitles = [...new Set(rows.map((row) => row.testTitle))];

          // Step 2: Fetch all required user and test documents in two efficient queries
          const userQuery = query(
            collection(db, "users"),
            where("email", "in", userEmails)
          );
          const testQuery = query(
            collection(db, "mockTests"),
            where("title", "in", testTitles)
          );

          const [userSnap, testSnap] = await Promise.all([
            getDocs(userQuery),
            getDocs(testQuery),
          ]);

          const usersMap = new Map(
            userSnap.docs.map((d) => [d.data().email, d.data().uid])
          );
          const testsMap = new Map(
            testSnap.docs.map((d) => [d.data().title, d.id])
          );

          // Step 3: Prepare a batch write to update all documents at once
          const batch = writeBatch(db);
          let updatesCount = 0;

          rows.forEach((row) => {
            const userId = usersMap.get(row.userEmail);
            const testId = testsMap.get(row.testTitle);

            if (userId && testId) {
              const testRef = doc(db, "mockTests", testId);
              batch.update(testRef, { allowedUserIds: arrayUnion(userId) });
              updatesCount++;
            }
          });

          if (updatesCount === 0) {
            throw new Error("No valid user/test pairs found in the CSV.");
          }

          await batch.commit();
          toast.success(
            `Successfully granted access for ${updatesCount} entries.`,
            { id: loadingToast }
          );
          if (onUpdate) onUpdate(); // Trigger a refresh on the parent page
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
      <p className='text-sm text-slate-600 mb-4'>
        Grant access to multiple users for multiple tests in a single upload.
        Ensure the user emails and test titles in the CSV are exact matches.
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
