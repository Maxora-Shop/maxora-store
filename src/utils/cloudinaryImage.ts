/**
 * Apply Cloudinary CDN transformations to image URLs without changing
 * non-Cloudinary URLs (including local paths and data URLs).
 */
export const optimizeCloudinaryImage = (
  source: string | undefined,
  width = 700,
  quality: number | 'auto' = 70
): string => {
  if (!source || !/^https?:\/\//i.test(source)) return source || '';

  try {
    const url = new URL(source);
    if (
      url.hostname.toLowerCase() !== 'res.cloudinary.com' ||
      !url.pathname.includes('/image/upload/')
    ) {
      return source;
    }

    const marker = '/image/upload/';
    const uploadIndex = url.pathname.indexOf(marker);
    const prefix = url.pathname.slice(0, uploadIndex + marker.length);
    const remainder = url.pathname.slice(uploadIndex + marker.length);
    const segments = remainder.split('/');
    const first = segments[0] || '';

    // A Cloudinary transformation segment contains known transformation keys.
    const isTransformation = /^(?:w_|h_|c_|q_|f_|dpr_|ar_|g_|e_|t_|fl_|r_|b_|bo_|d_|l_|o_|pg_|x_|y_|z_)/i.test(first);
    const requested = [
      'w_' + Math.max(1, Math.round(width)),
      'c_limit',
      'f_auto',
      'q_' + quality,
    ];

    if (isTransformation) {
      const preserved = first
        .split(',')
        .filter((part) =>
          !/^w_\d+$/i.test(part) &&
          !/^q_(?:auto|\d+)(?::.*)?$/i.test(part) &&
          !/^f_[\w-]+$/i.test(part) &&
          !/^c_(?:limit|scale|fit|fill|lfill|mfit|pad|mpad|thumb)$/i.test(part)
        );
      segments[0] = [...preserved, ...requested].join(',');
    } else {
      segments.unshift(requested.join(','));
    }

    url.pathname = prefix + segments.join('/');
    return url.toString();
  } catch {
    return source;
  }
};
