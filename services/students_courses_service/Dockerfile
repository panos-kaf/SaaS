# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy only package files first (improves caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Now copy the rest of the source code
COPY . .

# Expose the service port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
