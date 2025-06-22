FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the service port
EXPOSE 3006

# Command to run the service
CMD ["npm", "start"]