# Multi-File Conversion Service Dockerfile
# This Dockerfile includes GraphicsMagick installation for file conversions

FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install system dependencies for all conversions
RUN apt-get update && apt-get install -y \
    graphicsmagick \
    imagemagick \
    poppler-utils \
    ghostscript \
    libgraphicsmagick++-dev \
    libmagick++-dev \
    ffmpeg \
    libreoffice \
    libreoffice-writer \
    pandoc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ALL dependencies (using npm install for better compatibility)
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 10000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Start the application directly with node
CMD ["node", "dist/index.js"]