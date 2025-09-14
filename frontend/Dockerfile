# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm for better reliability
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set registry https://registry.npmjs.org/

# Install dependencies with multiple attempts using legacy-peer-deps and force
RUN for i in $(seq 1 5); do \
      echo "Attempt $i to install dependencies..." && \
      npm install --legacy-peer-deps --force && exit 0 || \
      echo "Attempt $i failed, waiting before retry..." && \
      sleep 5; \
    done && \
    echo "All attempts failed" && \
    exit 1

# Install specific versions of problematic dependencies
RUN npm install --legacy-peer-deps --force ajv-keywords@3.5.2 schema-utils@3.1.1 terser-webpack-plugin@5.3.1

# Copy source code
COPY . .

# Create a dummy health.json file for the health check
RUN echo '{"status":"UP"}' > public/health.json

# Set build arguments
ARG REACT_APP_API_URL
ARG REACT_APP_SOCKET_URL
ARG REACT_APP_AI_API_URL
ARG REACT_APP_MONITORING_URL
ARG CACHEBUST=1

# Install react-scripts globally to avoid version conflicts
RUN npm install -g react-scripts@5.0.1

# Build the application with fallback mechanism
RUN CI=false GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=4096" \
    npm run build:react || \
    (echo "React build failed, using fallback build script..." && \
     node build.js)

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health.json || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
