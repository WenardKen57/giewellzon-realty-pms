function isYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return !!u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.has('v') || u.pathname.startsWith('/embed/');
    }
    return false;
  } catch {
    return false;
  }
}
module.exports = { isYouTubeUrl };