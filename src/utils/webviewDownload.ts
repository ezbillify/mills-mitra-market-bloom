// webviewDownload.ts - Add this to your Mills Mitra website

// Type definitions
interface WindowWithFlutter extends Window {
  Downloader?: {
    postMessage: (message: string) => void;
  };
  FlutterDownload?: {
    postMessage: (message: string) => void;
  };
}

interface FlutterMessage {
  base64: string;
  fileName: string;
  mimeType: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  amount: string;
}

type InvoiceDataInput = string | Blob | ArrayBuffer;

// Extend window object
declare const window: WindowWithFlutter;

// Check if we're running inside a Flutter WebView
function isFlutterWebView(): boolean {
  return !!(window.Downloader || window.FlutterDownload);
}

// Enhanced download function for Flutter WebView
function downloadInvoiceFlutter(invoiceData: InvoiceDataInput, fileName: string | null = null): void {
  console.log('📥 Starting Flutter download process...');
  
  if (!isFlutterWebView()) {
    console.log('❌ Not running in Flutter WebView, falling back to regular download');
    return downloadInvoiceRegular(invoiceData, fileName);
  }
  
  try {
    const finalFileName: string = fileName || `invoice_${Date.now()}.pdf`;
    let base64Data: string = '';
    let mimeType: string = 'application/pdf';
    
    if (typeof invoiceData === 'string') {
      if (invoiceData.startsWith('data:')) {
        const parts = invoiceData.split(',');
        base64Data = parts[1];
        mimeType = parts[0].split(';')[0].split(':')[1];
      } else if (invoiceData.startsWith('http')) {
        fetchAndDownload(invoiceData, finalFileName);
        return;
      } else {
        base64Data = invoiceData;
      }
    } else if (invoiceData instanceof Blob) {
      const reader = new FileReader();
      reader.onload = function(event: ProgressEvent<FileReader>): void {
        const result = event.target?.result as string;
        const base64 = result.split(',')[1];
        sendToFlutter(base64, finalFileName, invoiceData.type);
      };
      reader.readAsDataURL(invoiceData);
      return;
    } else if (invoiceData instanceof ArrayBuffer) {
      const blob = new Blob([invoiceData], { type: mimeType });
      const reader = new FileReader();
      reader.onload = function(event: ProgressEvent<FileReader>): void {
        const result = event.target?.result as string;
        const base64 = result.split(',')[1];
        sendToFlutter(base64, finalFileName, mimeType);
      };
      reader.readAsDataURL(blob);
      return;
    }

    sendToFlutter(base64Data, finalFileName, mimeType);
    
  } catch (error) {
    console.error('❌ Error in Flutter download:', error);
    downloadInvoiceRegular(invoiceData, fileName);
  }
}

// Function to fetch URL and download
async function fetchAndDownload(url: string, fileName: string): Promise<void> {
  try {
    console.log('🌐 Fetching URL:', url);
    const response = await fetch(url);
    const blob = await response.blob();

    const reader = new FileReader();
    reader.onload = function(event: ProgressEvent<FileReader>): void {
      const result = event.target?.result as string;
      const base64Data = result.split(',')[1];
      sendToFlutter(base64Data, fileName, blob.type);
    };
    reader.readAsDataURL(blob);

  } catch (error) {
    console.error('❌ Error fetching URL:', error);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  }
}

// ✅ UPDATED FUNCTION — Send data as expected by Android WebView
function sendToFlutter(base64Data: string, fileName: string, mimeType: string): void {
  const dataUrl = `data:${mimeType};base64,${base64Data}`;
  const message = {
    url: dataUrl, // ✅ Kotlin expects "url"
    filename: fileName,
    mimeType: mimeType
  };

  console.log('📤 Sending to Flutter/Android WebView:', {
    ...message,
    dataSize: base64Data.length
  });

  if (window.Downloader) {
    window.Downloader.postMessage(JSON.stringify(message));
  }
  if (window.FlutterDownload) {
    window.FlutterDownload.postMessage(JSON.stringify(message));
  }

  console.log('✅ Download request sent to WebView');
}

// Regular download fallback for web browsers
function downloadInvoiceRegular(invoiceData: InvoiceDataInput, fileName: string | null = null): void {
  console.log('🌐 Using regular browser download');

  const finalFileName: string = fileName || `invoice_${Date.now()}.pdf`;

  if (typeof invoiceData === 'string' && invoiceData.startsWith('http')) {
    const link = document.createElement('a');
    link.href = invoiceData;
    link.download = finalFileName;
    link.click();
  } else {
    let blob: Blob;
    if (invoiceData instanceof Blob) {
      blob = invoiceData;
    } else if (typeof invoiceData === 'string') {
      const binaryString = atob(invoiceData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: 'application/pdf' });
    } else {
      blob = new Blob([invoiceData], { type: 'application/pdf' });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function downloadInvoice(invoiceData: InvoiceDataInput, fileName: string | null = null): void {
  console.log('📥 Download request received:', { fileName, isFlutterWebView: isFlutterWebView() });

  if (isFlutterWebView()) {
    downloadInvoiceFlutter(invoiceData, fileName);
  } else {
    downloadInvoiceRegular(invoiceData, fileName);
  }
}

// Example usage functions

function downloadPDFFromBase64(base64String: string, fileName: string = 'invoice.pdf'): void {
  downloadInvoice(base64String, fileName);
}

function downloadFromURL(url: string, fileName: string = 'invoice.pdf'): void {
  downloadInvoice(url, fileName);
}

function downloadFromBlob(blob: Blob, fileName: string = 'invoice.pdf'): void {
  downloadInvoice(blob, fileName);
}

const downloadBlob = downloadFromBlob;

function generateAndDownloadInvoice(invoiceData: InvoiceData): void {
  try {
    if (typeof (window as any).jsPDF !== 'undefined') {
      const jsPDF = (window as any).jsPDF;
      const doc = new jsPDF();
      doc.text('Invoice', 20, 20);
      doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 30);
      doc.text(`Date: ${invoiceData.date}`, 20, 40);
      doc.text(`Amount: ${invoiceData.amount}`, 20, 50);

      const pdfBlob: Blob = doc.output('blob');
      downloadInvoice(pdfBlob, `invoice_${invoiceData.invoiceNumber}.pdf`);
    } else {
      console.error('jsPDF not available');
    }
  } catch (error) {
    console.error('Error generating invoice:', error);
  }
}

// Hook for invoice buttons
document.addEventListener('DOMContentLoaded', function(): void {
  console.log('🔧 Setting up download interceptors...');

  const downloadButtons = document.querySelectorAll('[data-download], .download-btn, .invoice-download');

  downloadButtons.forEach((button: Element) => {
    button.addEventListener('click', function(this: HTMLElement, e: Event): void {
      e.preventDefault();

      const downloadUrl = this.getAttribute('data-url') || (this as HTMLAnchorElement).href;
      const fileName = this.getAttribute('data-filename') || 'invoice.pdf';

      if (downloadUrl) {
        downloadInvoice(downloadUrl, fileName);
      }
    });
  });

  console.log(`✅ Set up ${downloadButtons.length} download interceptors`);
});

// Export functions
export {
  downloadInvoice,
  downloadPDFFromBase64,
  downloadFromURL,
  downloadFromBlob,
  downloadBlob,
  generateAndDownloadInvoice,
  isFlutterWebView
};

// Global access
(window as any).downloadInvoice = downloadInvoice;
(window as any).downloadPDFFromBase64 = downloadPDFFromBase64;
(window as any).downloadFromURL = downloadFromURL;
(window as any).downloadFromBlob = downloadFromBlob;

console.log('✅ WebView download script loaded successfully');
