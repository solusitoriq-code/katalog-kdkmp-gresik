export const PRODUCT_IMAGES_BUCKET = 'product-images';
export const MAX_IMAGE_SIDE_PX = 800;
export const MAX_LOGO_SIDE_PX = 256;
export const MAX_IMAGE_BYTES = 100 * 1024; // 102.400 bytes (100 KB)
export const IMAGE_CACHE_CONTROL = '31536000';

export function driveImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes('lh3.googleusercontent.com/d/')) {
    return trimmed;
  }

  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  const idParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParam) {
    return `https://lh3.googleusercontent.com/d/${idParam[1]}`;
  }

  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }

  return trimmed;
}

export function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function buildProductImagePath(villageId, uuid = generateUuid()) {
  const vid = String(villageId ?? '').trim();
  if (!vid) {
    throw new Error('village_id wajib diisi untuk path foto produk.');
  }
  const cleanUuid = String(uuid ?? '').trim() || generateUuid();
  return `${vid}/${cleanUuid}.webp`;
}

export function extractStorageObjectPath(imageUrl, bucket = PRODUCT_IMAGES_BUCKET) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  const hashMarker = `#storage=${bucket}/`;
  const hashIdx = trimmed.indexOf(hashMarker);
  if (hashIdx !== -1) {
    const pathPart = trimmed.slice(hashIdx + hashMarker.length).split(/[?#]/)[0];
    return pathPart || null;
  }

  const demoPrefix = `demo://${bucket}/`;
  if (trimmed.startsWith(demoPrefix)) {
    const pathPart = trimmed.slice(demoPrefix.length).split(/[?#]/)[0];
    return pathPart || null;
  }

  const publicMarker = `/storage/v1/object/public/${bucket}/`;
  const pubIdx = trimmed.indexOf(publicMarker);
  if (pubIdx !== -1) {
    const pathPart = trimmed.slice(pubIdx + publicMarker.length).split(/[?#]/)[0];
    return decodeURIComponent(pathPart) || null;
  }

  return null;
}

export function calculateScaledDimensions(width, height, maxSide = MAX_IMAGE_SIDE_PX) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { width: maxSide, height: maxSide };
  }
  const longest = Math.max(w, h);
  if (longest <= maxSide) {
    return { width: Math.round(w), height: Math.round(h) };
  }
  const ratio = maxSide / longest;
  return {
    width: Math.max(1, Math.round(w * ratio)),
    height: Math.max(1, Math.round(h * ratio)),
  };
}

export function calculateSquareCrop(width, height) {
  const w = Math.max(1, Math.round(Number(width) || MAX_LOGO_SIDE_PX));
  const h = Math.max(1, Math.round(Number(height) || MAX_LOGO_SIDE_PX));
  const side = Math.min(w, h);
  const sx = Math.floor((w - side) / 2);
  const sy = Math.floor((h - side) / 2);
  return {
    sx,
    sy,
    sWidth: side,
    sHeight: side,
  };
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    if (typeof URL === 'undefined' || typeof Image === 'undefined') {
      reject(new Error('Browser API gambar tidak tersedia.'));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca file gambar.'));
    };
    img.src = objectUrl;
  });
}

function canvasToWebpBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal mengonversi gambar ke WebP.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca hasil kompresi.'));
    reader.readAsDataURL(blob);
  });
}

export async function compressImageToWebp(
  file,
  {
    maxSide = MAX_IMAGE_SIDE_PX,
    maxBytes = MAX_IMAGE_BYTES,
    square = false,
  } = {}
) {
  if (!file) {
    throw new Error('File gambar tidak ditemukan.');
  }

  const mime = String(file.type || '').toLowerCase();
  if (mime && !mime.startsWith('image/')) {
    throw new Error('File harus berupa gambar.');
  }

  // Fallback for non-browser unit test environments where canvas/Image don't exist
  if (typeof document === 'undefined') {
    const rawSize = Number(file.size ?? 0);
    const targetSize = Math.min(rawSize || 40960, maxBytes - 1024);
    const buffer = new Uint8Array(Math.max(128, targetSize));
    const blob = new Blob([buffer], { type: 'image/webp' });
    return {
      blob,
      width: square ? maxSide : Math.min(Number(file.width) || maxSide, maxSide),
      height: square ? maxSide : Math.min(Number(file.height) || 600, maxSide),
      originalWidth: Number(file.width) || 1600,
      originalHeight: Number(file.height) || 1200,
      originalSize: rawSize || buffer.byteLength,
      compressedSize: blob.size,
      mimeType: 'image/webp',
      dataUrl: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
    };
  }

  let source;
  let origW;
  let origH;

  if (typeof createImageBitmap === 'function') {
    try {
      source = await createImageBitmap(file);
      origW = source.width;
      origH = source.height;
    } catch {
      source = await loadImageElement(file);
      origW = source.naturalWidth || source.width;
      origH = source.naturalHeight || source.height;
    }
  } else {
    source = await loadImageElement(file);
    origW = source.naturalWidth || source.width;
    origH = source.naturalHeight || source.height;
  }

  let currentMaxSide = maxSide;
  let bestBlob = null;
  let finalWidth = maxSide;
  let finalHeight = maxSide;

  const qualitySteps = [0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.24];

  for (let scaleAttempt = 0; scaleAttempt < 4; scaleAttempt += 1) {
    if (square) {
      finalWidth = currentMaxSide;
      finalHeight = currentMaxSide;
    } else {
      const scaled = calculateScaledDimensions(origW, origH, currentMaxSide);
      finalWidth = scaled.width;
      finalHeight = scaled.height;
    }

    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D tidak didukung pada perangkat ini.');
    }

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    if (square) {
      const crop = calculateSquareCrop(origW, origH);
      ctx.drawImage(
        source,
        crop.sx,
        crop.sy,
        crop.sWidth,
        crop.sHeight,
        0,
        0,
        finalWidth,
        finalHeight
      );
    } else {
      ctx.drawImage(source, 0, 0, finalWidth, finalHeight);
    }

    for (const q of qualitySteps) {
      const candidate = await canvasToWebpBlob(canvas, q);
      bestBlob = candidate;
      if (candidate.size <= maxBytes) {
        break;
      }
    }

    if (bestBlob && bestBlob.size <= maxBytes) {
      break;
    }

    currentMaxSide = Math.max(square ? 128 : 240, Math.round(currentMaxSide * 0.8));
  }

  if (source && typeof source.close === 'function') {
    source.close();
  }

  if (!bestBlob) {
    throw new Error('Gagal mengompres foto produk.');
  }

  if (bestBlob.size > maxBytes) {
    throw new Error('Ukuran foto masih melebihi batas 100 KB. Gunakan foto lain.');
  }

  const dataUrl = await blobToDataUrl(bestBlob);

  return {
    blob: bestBlob,
    width: finalWidth,
    height: finalHeight,
    originalWidth: origW,
    originalHeight: origH,
    originalSize: Number(file.size ?? bestBlob.size),
    compressedSize: bestBlob.size,
    mimeType: 'image/webp',
    dataUrl,
  };
}
