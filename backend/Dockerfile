# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install the required dependencies
RUN pip install --no-cache-dir fastapi uvicorn kubernetes

# Expose port for FastAPI (defaults to 8000)
EXPOSE 8000

# Define the command to run the FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


