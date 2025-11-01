# --- Stage 1: Build Stage (for Next.js compilation) ---
# Use a Node image for building the Next.js application
FROM node:20-slim as builder

# Set the working directory for the application
WORKDIR /app

# Copy package.json and package-lock.json (if using npm) or equivalent
COPY package.json ./

# Install Node dependencies
# We use 'npm ci' for clean, repeatable installs
RUN npm install

# Copy all application source files
COPY . .

# Build the Next.js application for production
# This creates the .next folder with optimized code
RUN npm run build

# --- Stage 2: Runtime Stage (for running the production app and Python tasks) ---
# Use the same Node image for consistency and smallest size
FROM node:20-slim

# Set the working directory
WORKDIR /app

# 1. Install Python 3 and pip
# Update package list and install necessary Python tools
# python3-pip includes pip, which is used to install pandas and nba_api
RUN apt-get update \
    && apt-get install -y python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python dependencies using --break-system-packages
# This flag is necessary on newer Debian/Ubuntu-based images (like node:slim)
# to bypass the 'externally-managed-environment' error and allow global installation.
RUN pip3 install --break-system-packages pandas nba_api

# Copy the build artifacts from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/public ./public

COPY --from=builder /app/scripts ./scripts
# Copy any necessary files for the Node runtime (like next.config.js, etc.)
COPY next.config.ts .

# Expose the port Next.js runs on (default 3000)
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production

# Command to run the application (defined in your package.json's 'start' script)
CMD ["npm", "start"]
