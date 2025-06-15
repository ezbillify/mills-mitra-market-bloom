
// Debug utility for troubleshooting customer data issues
export class DebugUtils {
  private static isDebugMode = false;
  
  static enableDebug() {
    this.isDebugMode = true;
    console.log('🐛 DEBUG MODE ENABLED - Customer data debugging active');
  }
  
  static disableDebug() {
    this.isDebugMode = false;
    console.log('🐛 DEBUG MODE DISABLED');
  }
  
  static isDebugEnabled() {
    return this.isDebugMode;
  }
  
  static log(component: string, message: string, data?: any) {
    if (this.isDebugMode) {
      console.log(`🐛 [${component}] ${message}`, data || '');
    }
  }
  
  static error(component: string, message: string, error?: any) {
    if (this.isDebugMode) {
      console.error(`🐛 [${component}] ERROR: ${message}`, error || '');
    }
  }
  
  static table(component: string, message: string, data: any[]) {
    if (this.isDebugMode) {
      console.log(`🐛 [${component}] ${message}`);
      console.table(data);
    }
  }
}

// Global debug control
declare global {
  interface Window {
    enableDebug: () => void;
    disableDebug: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.enableDebug = () => DebugUtils.enableDebug();
  window.disableDebug = () => DebugUtils.disableDebug();
}
