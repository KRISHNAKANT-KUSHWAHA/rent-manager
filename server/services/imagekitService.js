/**
 * ImageKit Cloud Media Storage Service
 * Handles uploading Aadhaar cards, tenant photos, meter readings, and receipts to ImageKit CDN.
 * Uses native Node 22 fetch - requires zero additional npm packages!
 */

const isImageKitConfigured = () => {
  return Boolean(
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  );
};

/**
 * Upload a file buffer or base64 to ImageKit
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} folder e.g. '/aadhaar', '/photos', '/meters'
 * @returns {Promise<{ url: string, fileId: string, thumbnailUrl: string } | null>}
 */
const uploadToImageKit = async (fileBuffer, fileName, folder = '/documents') => {
  if (!isImageKitConfigured()) {
    return null; // Fallback to local storage
  }

  try {
    const formData = new FormData();
    // ImageKit accepts direct base64 string for maximum reliability
    const base64File = fileBuffer.toString('base64');
    formData.append('file', base64File);
    formData.append('fileName', fileName);
    formData.append('folder', `/kirayakhata${folder}`);
    formData.append('useUniqueFileName', 'true');

    const authHeader =
      'Basic ' +
      Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ':').toString('base64');

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ImageKit Error]', errorText);
      throw new Error(`ImageKit upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.url,
      fileId: data.fileId,
      thumbnailUrl: data.thumbnailUrl,
    };
  } catch (err) {
    console.error('[ImageKit Exception]', err.message);
    throw err;
  }
};

/**
 * Delete a file from ImageKit by fileId
 * @param {string} fileId
 */
const deleteFromImageKit = async (fileId) => {
  if (!fileId || !process.env.IMAGEKIT_PRIVATE_KEY) return;

  try {
    const authHeader =
      'Basic ' +
      Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ':').toString('base64');

    await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
      },
    });
  } catch (err) {
    console.error('[ImageKit Delete Error]', err.message);
  }
};

module.exports = {
  isImageKitConfigured,
  uploadToImageKit,
  deleteFromImageKit,
};
