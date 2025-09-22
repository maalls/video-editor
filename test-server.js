// Simple test server to verify basic functionality
import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
   res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Simple test server is running',
   });
});

app.get('/test', (req, res) => {
   res.json({
      message: 'Test endpoint working',
      status: 'ok',
   });
});

app.listen(PORT, () => {
   console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
   console.log('Available endpoints:');
   console.log('  GET /health - Health check');
   console.log('  GET /test   - Test endpoint');
});
