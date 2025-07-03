import BlogEditor from "@/components/admin/BlogEditor";

export default function BlogManagementPage() {
  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>
        Blog Management
      </h1>
      <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg'>
        <h2 className='text-xl font-semibold mb-6 text-slate-900'>
          Create New Post
        </h2>
        <BlogEditor />
      </div>
      {/* We can add a list of existing posts to edit/delete here in a future update */}
    </div>
  );
}
