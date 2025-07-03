"use client";

export default function YouTubeEmbed({ url }) {
  // This function is now more robust and handles multiple YouTube URL formats.
  const getEmbedUrl = (youtubeUrl) => {
    if (!youtubeUrl) return null;

    let videoId;

    // Handle standard "watch" URLs: https://www.youtube.com/watch?v=VIDEO_ID
    if (youtubeUrl.includes("watch?v=")) {
      videoId = youtubeUrl.split("watch?v=")[1].split("&")[0];
    }
    // Handle shortened "youtu.be" URLs: https://youtu.be/VIDEO_ID
    else if (youtubeUrl.includes("youtu.be/")) {
      videoId = youtubeUrl.split("youtu.be/")[1].split("?")[0];
    }
    // Handle embed URLs just in case
    else if (youtubeUrl.includes("/embed/")) {
      videoId = youtubeUrl.split("/embed/")[1].split("?")[0];
    } else {
      // If the URL format is not recognized, we can't create an embed
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  };

  const embedUrl = getEmbedUrl(url);

  // If no valid embed URL could be created, don't render anything
  if (!embedUrl) {
    return null;
  }

  return (
    <div className='aspect-w-16 aspect-h-9 my-8 md:my-12'>
      <iframe
        src={embedUrl}
        title='YouTube video player'
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        allowFullScreen
        className='w-full h-full rounded-2xl shadow-2xl border-4 border-white'
      ></iframe>
    </div>
  );
}
