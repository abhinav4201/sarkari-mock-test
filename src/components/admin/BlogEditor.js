"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css"; // import styles

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function BlogEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, slug, youtubeUrl }),
      });

      if (res.ok) {
        setStatus("Post created successfully!");
        // Clear form
        setTitle("");
        setContent("");
        setSlug("");
        setYoutubeUrl("");
      } else {
        const error = await res.json();
        throw new Error(error.message);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleSlugGeneration = () => {
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphen
      .replace(/(^-|-$)+/g, ""); // remove leading/trailing hyphens
    setSlug(generatedSlug);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block font-bold'>Post Title</label>
        <input
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full p-2 border rounded'
          required
        />
      </div>

      <div>
        <label className='block font-bold'>Post Slug (URL)</label>
        <div className='flex items-center space-x-2'>
          <input
            type='text'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className='w-full p-2 border rounded'
            required
          />
          <button
            type='button'
            onClick={handleSlugGeneration}
            className='p-2 bg-blue-500 text-white rounded'
          >
            Generate
          </button>
        </div>
      </div>

      <div>
        <label className='block font-bold'>YouTube URL</label>
        <input
          type='url'
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className='w-full p-2 border rounded'
        />
      </div>

      <div>
        <label className='block font-bold'>Content</label>
        <ReactQuill theme='snow' value={content} onChange={setContent} />
      </div>

      <button
        type='submit'
        className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
      >
        Create Post
      </button>
      {status && <p className='mt-2'>{status}</p>}
    </form>
  );
}
