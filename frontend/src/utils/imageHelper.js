export const LOCAL_IMAGES = [
  '/images/flat-1.jpg',
  '/images/flat-2.jpg',
  '/images/flat-3.jpg',
  '/images/flat-4.jpg',
  '/images/flat-5.jpg',
  '/images/flat-6.jpg',
  '/images/flat-7.jpg'
];

const URL_MAP = {
  '1522708323590': '/images/flat-1.jpg',
  '1502672260266': '/images/flat-2.jpg',
  '1560448204': '/images/flat-3.jpg',
  '1484154218962': '/images/flat-4.jpg',
  '1493809842364': '/images/flat-5.jpg',
  '1600585154340': '/images/flat-6.jpg',
  '1545324418': '/images/flat-7.jpg'
};

export function getSafeImageUrl(url, fallbackIndex = 0) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return LOCAL_IMAGES[fallbackIndex % LOCAL_IMAGES.length];
  }
  const clean = url.trim();
  if (clean.startsWith('/images/')) {
    return clean;
  }

  for (const [key, localPath] of Object.entries(URL_MAP)) {
    if (clean.includes(key)) {
      return localPath;
    }
  }

  return clean;
}

export function handleImageError(e, fallbackIndex = 0) {
  try {
    const fallback = LOCAL_IMAGES[fallbackIndex % LOCAL_IMAGES.length];
    if (e && e.currentTarget) {
      e.currentTarget.onerror = null;
      e.currentTarget.src = fallback;
    }
  } catch (err) {
    // ignore
  }
}
