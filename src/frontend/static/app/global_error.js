export default class GlobalError {
   init() {
      // Global error handling for better debugging
      window.addEventListener('error', event => {
         console.error('🚨 Global Error:', {
            message: event.message,
            filename: event.filename,
            line: event.lineno,
            column: event.colno,
            error: event.error,
         });
      });

      window.addEventListener('unhandledrejection', event => {
         console.error('🚨 Unhandled Promise Rejection:', event.reason);
      });
   }
}
