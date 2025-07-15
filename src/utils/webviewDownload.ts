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
    
    // Handle different input types
    if (typeof invoiceData === 'string') {
      // If it's already base64 or a URL
      if (invoiceData.startsWith('data:')) {
        // Data URL format
        const parts = invoiceData.split(',');
        base64Data = parts[1];
        mimeType = parts[0].split(';')[0].split(':')[1];
      } else if (invoiceData.startsWith('http')) {
        // URL - need to fetch it
        fetchAndDownload(invoiceData, finalFileName);
        return;
      } else {
        // Assume it's base64
        base64Data = invoiceData;
      }
    } else if (invoiceData instanceof Blob) {
      // Blob object
      const reader = new FileReader();
      reader.onload = function(event: ProgressEvent<FileReader>): void {
        const result = event.target?.result as string;
        const base64 = result.split(',')[1];
        sendToFlutter(base64, finalFileName, invoiceData.type);
      };
      reader.readAsDataURL(invoiceData);
      return;
    } else if (invoiceData instanceof ArrayBuffer) {
      // ArrayBuffer
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
    // Fallback to regular download
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
    // Try regular download as fallback
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  }
}

// Send data to Flutter
function sendToFlutter(base64Data: string, fileName: string, mimeType: string): void {
  const message: FlutterMessage = {
    base64: base64Data,
    fileName: fileName,
    mimeType: mimeType
  };
  
  console.log('📤 Sending to Flutter:', {
    fileName: fileName,
    mimeType: mimeType,
    dataSize: base64Data.length
  });
  
  // Try both channels for better compatibility
  if (window.Downloader) {
    window.Downloader.postMessage(JSON.stringify(message));
  }
  if (window.FlutterDownload) {
    window.FlutterDownload.postMessage(JSON.stringify(message));
  }
  
  console.log('✅ Download request sent to Flutter');
}

// Regular download fallback for web browsers
function downloadInvoiceRegular(invoiceData: InvoiceDataInput, fileName: string | null = null): void {
  console.log('🌐 Using regular browser download');
  
  const finalFileName: string = fileName || `invoice_${Date.now()}.pdf`;
  
  if (typeof invoiceData === 'string' && invoiceData.startsWith('http')) {
    // URL download
    const link = document.createElement('a');
    link.href = invoiceData;
    link.download = finalFileName;
    link.click();
  } else {
    // Data download
    let blob: Blob;
    if (invoiceData instanceof Blob) {
      blob = invoiceData;
    } else if (typeof invoiceData === 'string') {
      // Assume base64
      const binaryString = atob(invoiceData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: 'application/pdf' });
    } else {
      // ArrayBuffer
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

// Main download function - automatically detects environment
function downloadInvoice(invoiceData: InvoiceDataInput, fileName: string | null = null): void {
  console.log('📥 Download request received:', { fileName, isFlutterWebView: isFlutterWebView() });
  
  if (isFlutterWebView()) {
    downloadInvoiceFlutter(invoiceData, fileName);
  } else {
    downloadInvoiceRegular(invoiceData, fileName);
  }
}

// Example usage functions for different scenarios:

// 1. Download PDF from base64 data
function downloadPDFFromBase64(base64String: string, fileName: string = 'invoice.pdf'): void {
  downloadInvoice(base64String, fileName);
}

// 2. Download from URL
function downloadFromURL(url: string, fileName: string = 'invoice.pdf'): void {
  downloadInvoice(url, fileName);
}

// 3. Download from Blob
function downloadFromBlob(blob: Blob, fileName: string = 'invoice.pdf'): void {
  downloadInvoice(blob, fileName);
}

// Alias for backward compatibility
const downloadBlob = downloadFromBlob;

// 4. Generate and download invoice (example with jsPDF)
function generateAndDownloadInvoice(invoiceData: InvoiceData): void {
  // This is an example - replace with your actual PDF generation logic
  try {
    // If using jsPDF
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

// Override existing download buttons to use the new system
document.addEventListener('DOMContentLoaded', function(): void {
  console.log('🔧 Setting up download interceptors...');
  
  // Find and override existing download buttons
  const downloadButtons = document.querySelectorAll('[data-download], .download-btn, .invoice-download');
  
  downloadButtons.forEach((button: Element) => {
    button.addEventListener('click', function(this: HTMLElement, e: Event): void {
      e.preventDefault();
      
      // Get download URL or data from button attributes
      const downloadUrl = this.getAttribute('data-url') || (this as HTMLAnchorElement).href;
      const fileName = this.getAttribute('data-filename') || 'invoice.pdf';
      
      if (downloadUrl) {
        downloadInvoice(downloadUrl, fileName);
      }
    });
  });
  
  console.log(`✅ Set up ${downloadButtons.length} download interceptors`);
});

// Export functions for use in other modules
export { 
  downloadInvoice, 
  downloadPDFFromBase64, 
  downloadFromURL, 
  downloadFromBlob,
  downloadBlob, // Alias for backward compatibility
  generateAndDownloadInvoice,
  isFlutterWebView
};

// Global function to trigger download from anywhere in your code
(window as any).downloadInvoice = downloadInvoice;
(window as any).downloadPDFFromBase64 = downloadPDFFromBase64;
(window as any).downloadFromURL = downloadFromURL;
(window as any).downloadFromBlob = downloadFromBlob;

console.log('✅ WebView download script loaded successfully');
