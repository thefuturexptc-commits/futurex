export function getYouTubeEmbed(source: string) {
  try {
    const parsed = new URL(source);
    const host = parsed.hostname.replace(/^www\./, '');
    const [section, pathId] = parsed.pathname.split('/').filter(Boolean);
    const isShort = section === 'shorts';
    let videoId: string | null | undefined;

    if (host === 'youtu.be') {
      videoId = section;
    } else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      videoId = isShort || section === 'embed' || section === 'live'
        ? pathId
        : parsed.searchParams.get('v');
    }

    return videoId && /^[\w-]{11}$/.test(videoId)
      ? { url: `https://www.youtube-nocookie.com/embed/${videoId}`, isShort }
      : null;
  } catch {
    return null;
  }
}
