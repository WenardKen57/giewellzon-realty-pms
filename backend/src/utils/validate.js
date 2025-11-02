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
// Philippine mobile numbers: 09123456789, +639123456789, 639123456789
function isValidPHMobile(input) {
  if (!input || typeof input !== 'string') return false;
  const cleaned = input.trim().replace(/[\s\-()]/g, '');
  return /^(09\d{9}|\+?639\d{9})$/.test(cleaned);
}

module.exports = { isYouTubeUrl, isValidPHMobile };