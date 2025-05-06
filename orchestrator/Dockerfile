# Use the official Node.js base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json if present
COPY package*.json ./

# Install any dependencies (none in this case)
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose port 8000 on the container
EXPOSE 8000

# Define the command to run the server
CMD ["npm", "start"]
