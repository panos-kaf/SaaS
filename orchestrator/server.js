const http = require('http');

const PORT = 8000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.end('Hello from inside a Docker container!\n');
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
