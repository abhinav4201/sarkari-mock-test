"use client";

import { useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function DailyContentUploader({ uploadType }) {
  // 'vocabulary' or 'gk'
  const [files, setFiles] = useState({});
  const [category, setCategory] = useState(""); // Only for GK
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Uploading...");

    const isVocabulary = uploadType === "vocabulary";
    const requiredFiles = isVocabulary
      ? ["wordSvg", "meaningSvg"]
      : ["contentSvg"];

    for (const reqFile of requiredFiles) {
      if (!files[reqFile]) {
        setStatus(`Error: Please select the ${reqFile} file.`);
        return;
      }
    }

    try {
      // 1. Upload all files to Firebase Storage and get URLs
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        const storageRef = ref(
          storage,
          `daily-content/${uploadType}/${Date.now()}_${file.name}`
        );
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { [key]: downloadURL };
      });

      const uploadedUrlsArray = await Promise.all(uploadPromises);
      const uploadedUrls = Object.assign({}, ...uploadedUrlsArray);

      // 2. Send data to our API route
      const payload = {
        type: uploadType,
        urls: uploadedUrls,
        ...(isVocabulary ? {} : { category }), // Add category only for GK
      };

      const res = await fetch("/api/admin/daily-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to upload content");

      setStatus("Content uploaded successfully!");
      e.target.reset();
      setFiles({});
      setCategory("");
      router.refresh();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-xl font-semibold mb-4'>
        Upload New{" "}
        {uploadType === "vocabulary" ? "Vocabulary" : "General Knowledge"}
      </h2>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {uploadType === "vocabulary" ? (
          <>
            <div>
              <label className='block font-bold'>Word SVG</label>
              <input
                type='file'
                name='wordSvg'
                accept='image/svg+xml'
                onChange={handleFileChange}
                className='w-full'
                required
              />
            </div>
            <div>
              <label className='block font-bold'>Meaning SVG</label>
              <input
                type='file'
                name='meaningSvg'
                accept='image/svg+xml'
                onChange={handleFileChange}
                className='w-full'
                required
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className='block font-bold'>Content SVG</label>
              <input
                type='file'
                name='contentSvg'
                accept='image/svg+xml'
                onChange={handleFileChange}
                className='w-full'
                required
              />
            </div>
            <div>
              <label className='block font-bold'>Category</label>
              <input
                type='text'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder='e.g., Country Capitals'
                className='w-full p-2 border rounded'
                required
              />
            </div>
          </>
        )}
        <button
          type='submit'
          className='w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
        >
          Upload
        </button>
        {status && <p className='mt-2 text-center'>{status}</p>}
      </form>
    </div>
  );
}
