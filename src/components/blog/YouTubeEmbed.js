"use client"; // This component has no server-side logic, but good practice for leaf components.

const YouTubeEmbed = ({ url }) => {
  // Transforms a regular YouTube URL into an embeddable URL
  const getEmbedUrl = (youtubeUrl) => {
    const videoId = youtubeUrl.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (!url) return null;

  const embedUrl = getEmbedUrl(url);

  return (
    <div className='aspect-w-16 aspect-h-9 my-6'>
      <iframe
        src={embedUrl}
        title='YouTube video player'
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        allowFullScreen
        className='w-full h-full rounded-lg shadow-lg'
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed;
