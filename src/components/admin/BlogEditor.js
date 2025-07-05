"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect } from "react"; // Import useEffect
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

// A simple toolbar for our editor (no changes needed here)
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
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [featuredImageSvgCode, setFeaturedImageSvgCode] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // --- NEW LOGIC: Auto-generate slug from title ---
  useEffect(() => {
    // Only generate slug if the user hasn't manually edited it
    if (!isSlugManuallyEdited) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric characters except spaces and hyphens
        .trim() // Trim leading/trailing whitespace
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with a single one
      setSlug(generatedSlug);
    }
  }, [title, isSlugManuallyEdited]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your amazing blog post here...",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none w-full p-4 border-x border-b border-slate-300 rounded-b-lg min-h-[200px] focus:outline-none text-slate-900",
      },
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFeaturedImageSvgCode(evt.target.result);
        toast.success("Featured image loaded.");
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in.");

    const htmlContent = editor.getHTML();
    setIsLoading(true);
    const loadingToast = toast.loading("Submitting post...");

    try {
      // Write directly from the client to Firestore
      await addDoc(collection(db, "posts"), {
        title,
        content: htmlContent,
        slug,
        youtubeUrl: youtubeUrl || "",
        featuredImageSvgCode: featuredImageSvgCode || "",
        createdAt: serverTimestamp(),
      });

      toast.success("Post created successfully!", { id: loadingToast });
      // ... (rest of form clearing logic) ...
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW LOGIC: Handle manual slug input ---
  const handleSlugChange = (e) => {
    setIsSlugManuallyEdited(true); // Mark slug as manually edited
    setSlug(e.target.value);
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
        {/* The "Generate" button is now removed */}
        <input
          id='blog-slug'
          type='text'
          value={slug}
          onChange={handleSlugChange} // Use the new handler
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
      </div>
      <div>
        <label
          htmlFor='youtube-url'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          YouTube URL (Optional)
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
        <label
          htmlFor='featured-image'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Featured Image SVG (Optional)
        </label>
        <input
          id='featured-image'
          type='file'
          accept='image/svg+xml'
          onChange={handleFileChange}
          className='w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
        />
      </div>
      {featuredImageSvgCode && (
        <div>
          <label className='block text-sm font-medium text-slate-900'>
            Image Preview
          </label>
          <div className='mt-1 border border-slate-300 rounded-lg p-2 h-40 overflow-auto bg-slate-50'>
            <div dangerouslySetInnerHTML={{ __html: featuredImageSvgCode }} />
          </div>
        </div>
      )}
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
