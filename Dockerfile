# Multi-File Conversion Service Dockerfile
# Includes GraphicsMagick, ImageMagick, FFmpeg, and Pandoc for conversions

FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install system dependencies including GraphicsMagick and Pandoc
RUN apt-get update && apt-get install -y \
    graphicsmagick \
    imagemagick \
    poppler-utils \
    ghostscript \
    pandoc \
    libgraphicsmagick++-dev \
    libmagick++-dev \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Create uploads directory
RUN mkdir -p uploads

# Verify critical dependencies are installed
RUN gm version && ffmpeg -version && convert -version && pandoc --version

# Expose port
EXPOSE 10000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000
# Prevent OOM errors for large file conversions
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Start the application
CMD ["node", "dist/index.js"]
