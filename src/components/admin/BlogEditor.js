"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder"; // <-- Import the new extension
import { useState } from "react";
import toast from "react-hot-toast";

// A simple toolbar for our editor with corrected high-contrast styles
const TiptapToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }
  return (
    <div className='border border-slate-300 rounded-t-lg p-2 flex items-center flex-wrap gap-2 bg-slate-50'>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded font-medium text-sm ${
          editor.isActive("bold")
            ? "bg-indigo-600 text-white"
            : "text-slate-700 hover:bg-slate-200"
        }`}
      >
        Bold
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded font-medium text-sm ${
          editor.isActive("italic")
            ? "bg-indigo-600 text-white"
            : "text-slate-700 hover:bg-slate-200"
        }`}
      >
        Italic
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded font-medium text-sm ${
          editor.isActive("heading", { level: 2 })
            ? "bg-indigo-600 text-white"
            : "text-slate-700 hover:bg-slate-200"
        }`}
      >
        H2
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 rounded font-medium text-sm ${
          editor.isActive("heading", { level: 3 })
            ? "bg-indigo-600 text-white"
            : "text-slate-700 hover:bg-slate-200"
        }`}
      >
        H3
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded font-medium text-sm ${
          editor.isActive("bulletList")
            ? "bg-indigo-600 text-white"
            : "text-slate-700 hover:bg-slate-200"
        }`}
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
  const [isLoading, setIsLoading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      // Configure the placeholder extension
      Placeholder.configure({
        placeholder: "Start writing your amazing blog post here...",
      }),
    ],
    editorProps: {
      attributes: {
        // These prose classes ensure the text you TYPE is black and high-contrast
        class:
          "prose prose-lg max-w-none w-full p-4 border-x border-b border-slate-300 rounded-b-lg min-h-[200px] focus:outline-none text-slate-900",
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const htmlContent = editor.getHTML();
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

  const handleSlugGeneration = () => {
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(generatedSlug);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label
          htmlFor='blog-title'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Post Title
        </label>
        <input
          id='blog-title'
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
      </div>
      <div>
        <label
          htmlFor='blog-slug'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Post Slug (URL)
        </label>
        <div className='flex items-center space-x-2'>
          <input
            id='blog-slug'
            type='text'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
            required
          />
          <button
            type='button'
            onClick={handleSlugGeneration}
            className='px-4 py-3 bg-indigo-100 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-200'
          >
            Generate
          </button>
        </div>
      </div>
      <div>
        <label
          htmlFor='youtube-url'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          YouTube URL
        </label>
        <input
          id='youtube-url'
          type='url'
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-slate-800 mb-1'>
          Content
        </label>
        <div className='border border-slate-300 rounded-lg overflow-hidden'>
          <TiptapToolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </div>
      <div className='pt-2'>
        <button
          type='submit'
          disabled={isLoading}
          className='px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400'
        >
          {isLoading ? "Submitting..." : "Create Post"}
        </button>
      </div>
    </form>
  );
}
