const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('./config/config');
const { authenticateJWT, authorizeRoles } = require('./middleware/auth');

const app = express();

// Proxy rules (you can adjust paths based on frontend requests)

// Public routes BEFORE /users authentication
app.use('/signup', createProxyMiddleware({
  target: config.services.userManagement,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    console.log(`Rewriting signup path: ${path} → /add-user`);
    return '/add-user';
  },
}));

app.use('/signin', createProxyMiddleware({
  target: config.services.userManagement,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    console.log(`Rewriting signin path: ${path} → /signin`);
    return '/signin';
  },
}));

app.use('/users', authenticateJWT, createProxyMiddleware({
  target: config.services.userManagement,
  changeOrigin: true,
  pathRewrite: { '^/users': '' },
}));

app.use('/students-courses', authenticateJWT, createProxyMiddleware({
  target: config.services.studentsCourses,
  changeOrigin: true,
  pathRewrite: { '^/students-courses': '' },
}));

app.use('/grade-statistics', authenticateJWT, createProxyMiddleware({
  target: config.services.gradeStatistics,
  changeOrigin: true,
  pathRewrite: { '^/grade-statistics': '' },
}));

app.use('/requests', authenticateJWT, createProxyMiddleware({
  target: config.services.requests,
  changeOrigin: true,
  pathRewrite: { '^/requests': '' },
}));

app.use('/replies', authenticateJWT, createProxyMiddleware({
  target: config.services.replies,
  changeOrigin: true,
  pathRewrite: { '^/replies': '' },
}));

app.use('/post-grades', authenticateJWT, createProxyMiddleware({
  target: config.services.postGrades,
  changeOrigin: true,
  pathRewrite: { '^/post-grades': '' },
}));

app.use('/institutions', authenticateJWT, createProxyMiddleware({
  target: config.services.institution,
  changeOrigin: true,
  pathRewrite: { '^/institutions': '' },
}));

// Default
app.get('/', (req, res) => {
  res.send('API Gateway is running');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down gracefully');
  server.close(() => {
    console.log('API Gateway shut down');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received: shutting down gracefully');
  server.close(() => {
    console.log('API Gateway shut down');
    process.exit(0);
  });
});