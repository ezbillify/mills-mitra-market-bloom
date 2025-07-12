/**
 * WebView Download Utility
 * Handles file downloads for both Flutter WebView and regular browser environments
 */

export interface DownloadOptions {
  filename?: string;
  mimeType?: string;
}

/**
 * Sends download request to Flutter WebView or falls back to browser download
 * @param fileUrl - The URL of the file to download
 * @param options - Optional download configuration
 */
export const sendDownloadToFlutter = (fileUrl: string, options?: DownloadOptions) => {
  try {
    // Check if running in Flutter WebView
    if ((window as any).Downloader) {
      // Send message to Flutter WebView with additional metadata
      const downloadData = {
        url: fileUrl,
        filename: options?.filename,
        mimeType: options?.mimeType
      };
      
      (window as any).Downloader.postMessage(JSON.stringify(downloadData));
      return true;
    } else {
      // Fallback for regular browser
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
    console.error('Error sending download to WebView:', error);
    // Fallback to browser download
    window.open(fileUrl, '_blank');
    return false;
  }
};

/**
 * Downloads a Blob as a file (for generated content like PDFs)
 * @param blob - The blob data to download
 * @param filename - The filename for the download
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  try {
    const url = URL.createObjectURL(blob);
    
    // Check if running in Flutter WebView
    if ((window as any).Downloader) {
      const downloadData = {
        url: url,
        filename: filename,
        mimeType: blob.type
      };
      
      (window as any).Downloader.postMessage(JSON.stringify(downloadData));
    } else {
      // Fallback for regular browser
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error downloading blob:', error);
  }
};

/**
 * Checks if the app is running in a Flutter WebView
 */
export const isFlutterWebView = (): boolean => {
  return !!(window as any).Downloader;
};