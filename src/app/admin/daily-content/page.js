import DailyContentUploader from "@/components/admin/DailyContentUploader";
// We can add functions here later to fetch and display recent uploads

export default async function DailyContentPage() {
  // In the future, you can fetch recent uploads here to display them

  return (
    <div>
      <h1 className='text-3xl font-bold mb-6'>Manage Daily Content</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Vocabulary Uploader */}
        <DailyContentUploader uploadType='vocabulary' />

        {/* GK Uploader */}
        <DailyContentUploader uploadType='gk' />
      </div>

      {/* A section to display recent uploads can be added here */}
    </div>
  );
}
