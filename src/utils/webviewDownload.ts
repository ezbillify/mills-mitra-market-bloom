/**
 * WebView Download Utility for Flutter + Web
 */

export interface DownloadOptions {
  filename?: string;
  mimeType?: string;
}

/**
 * Checks if the app is running inside a Flutter WebView
 */
export const isFlutterWebView = (): boolean => {
  return !!(window as any).Downloader;
};

/**
 * Send direct file download request (URL or base64) to Flutter or fallback to browser
 */
export const sendDownloadToFlutter = (fileUrl: string, options?: DownloadOptions): boolean => {
  try {
    const downloadData = {
      url: fileUrl,
      filename: options?.filename,
      mimeType: options?.mimeType
    };

    if ((window as any).Downloader) {
      (window as any).Downloader.postMessage(JSON.stringify(downloadData));
      return true;
    } else {
      // Browser fallback
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
    console.error('❌ Error sending download to Flutter:', error);
    window.open(fileUrl, '_blank');
    return false;
  }
};

/**
 * Converts Blob to base64 data URL and sends to Flutter WebView or browser
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const reader = new FileReader();

  reader.onloadend = () => {
    const base64Data = reader.result as string; // This is a data:...;base64,... string

    const downloadData = {
      url: base64Data,         // ✅ full data: URL
      filename: filename,
      mimeType: blob.type
    };

    if ((window as any).Downloader) {
      (window as any).Downloader.postMessage(JSON.stringify(downloadData));
    } else {
      // Browser fallback
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  reader.onerror = () => {
    console.error('❌ Failed to read blob as base64');
  };

  reader.readAsDataURL(blob); // ✅ Triggers reader.onloadend
};
