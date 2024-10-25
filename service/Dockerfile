# Use an official Node.js runtime as a parent image
FROM node:16-slim

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json /app/

# Install the required dependencies
RUN npm install

# Copy the current directory contents into the container at /app
COPY . /app

# Expose port for Express (defaults to 3000)
EXPOSE 3000

# Define the command to run the Express app
CMD ["node", "server.js"]


