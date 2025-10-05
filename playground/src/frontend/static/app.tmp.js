import ViaUi from './app/ViaUi.js';
try {
   const app = new ViaUi();
   await app.start();
} catch (error) {
   console.error('Failed to start the app:', error);
   throw error;
}
