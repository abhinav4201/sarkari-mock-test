"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import toast from "react-hot-toast"; 

// A simple toolbar for our editor
const TiptapToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }
  return (
    <div className='border border-gray-300 rounded-t-lg p-2 flex items-center flex-wrap gap-2'>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={
          editor.isActive("bold") ? "bg-gray-300 p-1 rounded" : "p-1 rounded"
        }
      >
        Bold
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={
          editor.isActive("italic") ? "bg-gray-300 p-1 rounded" : "p-1 rounded"
        }
      >
        Italic
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={
          editor.isActive("heading", { level: 2 })
            ? "bg-gray-300 p-1 rounded"
            : "p-1 rounded"
        }
      >
        H2
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={
          editor.isActive("heading", { level: 3 })
            ? "bg-gray-300 p-1 rounded"
            : "p-1 rounded"
        }
      >
        H3
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={
          editor.isActive("bulletList")
            ? "bg-gray-300 p-1 rounded"
            : "p-1 rounded"
        }
      >
        List
      </button>
    </div>
  );
};

export default function BlogEditor() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing your amazing blog post here...</p>",
    editorProps: {
      attributes: {
        class:
          "prose lg:prose-xl max-w-none w-full p-4 border border-gray-300 rounded-b-lg min-h-[200px] focus:outline-none",
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const htmlContent = editor.getHTML(); // Get content from Tiptap
    setIsLoading(true);
    const loadingToast = toast.loading("Submitting post...");
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: htmlContent, slug, youtubeUrl }),
      });
      if (!res.ok) throw new Error("Server responded with an error");
      toast.success("Post created successfully!", { id: loadingToast });
      // Clear form
      editor.commands.clearContent();
      setTitle("");
      setSlug("");
      setYoutubeUrl("");
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  // (The handleSlugGeneration function remains the same as before)
  const handleSlugGeneration = () => {
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(generatedSlug);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* Input fields for Title, Slug, YouTube URL remain the same... */}
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
        <TiptapToolbar editor={editor} />
        <EditorContent editor={editor} />
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
