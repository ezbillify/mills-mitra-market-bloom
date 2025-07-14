/**
 * WebView Download Utility
 * Handles file downloads for both Flutter WebView and regular browser environments
 */

export interface DownloadOptions {
  filename?: string;
  mimeType?: string;
}

/**
 * Sends a direct file URL to Flutter WebView or triggers browser download
 * @param fileUrl - The URL of the file to download
 * @param options - Optional download configuration
 */
export const sendDownloadToFlutter = (fileUrl: string, options?: DownloadOptions) => {
  try {
    // Check if inside Flutter WebView
    if ((window as any).Downloader) {
      if (fileUrl.startsWith("blob:")) {
        alert("⚠️ Cannot download blob URLs directly. Use downloadBlob() for blob support.");
        return false;
      }

      const downloadData = {
        url: fileUrl,
        filename: options?.filename,
        mimeType: options?.mimeType
      };

      (window as any).Downloader.postMessage(JSON.stringify(downloadData));
      return true;
    } else {
      // Fallback for browser
      const link = document.createElement('a');
      link.href = fileUrl;
      if (options?.filename) {
        link.download = options.filename;
      }
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending download to WebView:', error);
    window.open(fileUrl, '_blank');
    return false;
  }
};

/**
 * Downloads a Blob as a file (for generated content like PDFs or Excel)
 * @param blob - The blob data to download
 * @param filename - The filename for the download
 */
export const downloadBlob = async (blob: Blob, filename: string) => {
  try {
    const reader = new FileReader();

    reader.onloadend = function () {
      const result = reader.result;
      if (!result || typeof result !== 'string') {
        console.error("❌ Failed to convert blob to base64");
        return;
      }

      const base64data = result.split(',')[1]; // remove `data:*/*;base64,`

      if ((window as any).Downloader) {
        const downloadData = {
          base64: base64data,
          filename: filename,
          mimeType: blob.type,
        };

        (window as any).Downloader.postMessage(JSON.stringify(downloadData));
      } else {
        // Browser fallback
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    };

    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('❌ Error downloading blob:', error);
  }
};

/**
 * Checks if the app is running in a Flutter WebView
 */
export const isFlutterWebView = (): boolean => {
  return !!(window as any).Downloader;
};
