const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('./config/config');
const { authenticateJWT, authorizeRoles, verifyResourceOwnership, attachUserHeader } = require('./middleware/auth');
const cors = require('cors');

const app = express();
app.use(cors());

const apiRouter = express.Router();

// Proxy rules (adjust paths as needed)

// Uncomment and adjust if you want signup/signin
/*
apiRouter.use('/signup', createProxyMiddleware({
  target: config.services.userManagement,
  changeOrigin: true,
  pathRewrite: (path, req) => '/add-user',
}));

apiRouter.use('/signin', createProxyMiddleware({
  target: config.services.userManagement,
  changeOrigin: true,
  pathRewrite: (path, req) => '/signin',
}));
*/

apiRouter.use('/auth/google', createProxyMiddleware({
  target: config.services.userManagement,
  changeOrigin: true,
}));

apiRouter.use('/auth/google/callback', createProxyMiddleware({
  target: config.services.userManagement,
  changeOrigin: true,
}));

apiRouter.use('/users', createProxyMiddleware({
  target: config.services.userManagement,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
}));

apiRouter.use('/student-courses', authenticateJWT, attachUserHeader, createProxyMiddleware({
  target: config.services.studentsCourses,
  changeOrigin: true,
  pathRewrite: { '^/api/student-courses': '' },
}));

apiRouter.use('/grade-statistics', authenticateJWT, attachUserHeader, createProxyMiddleware({
  target: config.services.gradeStatistics,
  changeOrigin: true,
  pathRewrite: { '^/api/grade-statistics': '' },
}));

apiRouter.use('/requests', authenticateJWT, attachUserHeader, createProxyMiddleware({
  target: config.services.requests,
  changeOrigin: true,
  pathRewrite: { '^/api/requests': '' },
}));

apiRouter.use('/replies', authenticateJWT, attachUserHeader, createProxyMiddleware({
  target: config.services.replies,
  changeOrigin: true,
  pathRewrite: { '^/api/replies': '' },
}));

apiRouter.use('/post-grades', authenticateJWT, attachUserHeader, createProxyMiddleware({
  target: config.services.postGrades,
  changeOrigin: true,
  pathRewrite: { '^/api/post-grades': '' },
}));

apiRouter.use('/institution', authenticateJWT, attachUserHeader, createProxyMiddleware({
  target: config.services.institution,
  changeOrigin: true,
  pathRewrite: { '^/api/institution': '' },
}));

// Default
apiRouter.get('/', (req, res) => {
  res.send('API Gateway is running');
});

app.use('/api', apiRouter);

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