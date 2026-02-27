import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = 'dyr6sb0tu';
const CLOUDINARY_UPLOAD_PRESET = 'E-awas2';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData
    );

    let url = response.data.secure_url;

    // This is the definitive fix. It guarantees the correct URL structure.
    // Some responses were incorrectly returning a /raw/ path.
    // This forcefully replaces it with the required /image/ path.
    if (url.includes('/raw/upload')) {
        url = url.replace('/raw/upload', '/image/upload');
    }

    // The 'fl_inline' flag is then added to ensure the PDF is displayed in the browser.
    if (file.type === 'application/pdf' && url.includes('/upload/')) {
      const parts = url.split('/upload/');
      // Avoid adding duplicate flags if one already exists
      if (!parts[1].startsWith('fl_inline')) {
          const inlineUrl = `${parts[0]}/upload/fl_inline/${parts[1]}`;
          return inlineUrl;
      }
    }

    return url;

  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message || 'Error uploading file.';
    console.error('Error uploading to Cloudinary:', errorMessage);
    throw new Error(errorMessage);
  }
};