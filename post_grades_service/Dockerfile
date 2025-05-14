# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# --- Release Stage ---
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy dependencies from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Copy application code
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/package*.json ./

# Make sure the uploads directory will be created if it isn't there by the controller
# RUN mkdir -p /usr/src/app/uploads

# Expose the port the app runs on
EXPOSE 3002

# Define the command to run the application
CMD [ "node", "src/index.js" ]

# Optional: Add a healthcheck
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -f http://localhost:3002/api/health || exit 1
# (You would need to implement a /api/health endpoint in your app for this)
