FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create uploads directory for potential file uploads
RUN mkdir -p uploads

# Expose the service port
EXPOSE 3007

# Command to run the service
CMD ["npm", "start"]
