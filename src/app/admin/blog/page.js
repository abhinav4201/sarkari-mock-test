import BlogEditor from "@/components/admin/BlogEditor";

export default function BlogManagementPage() {
  return (
    <div>
      <h1 className='text-3xl font-bold mb-6'>Blog Management</h1>
      <div className='bg-white p-6 rounded-lg shadow-md'>
        <h2 className='text-xl font-semibold mb-4'>Create New Post</h2>
        <BlogEditor />
      </div>
      {/* We will add a list of existing posts to edit/delete later */}
    </div>
  );
}
