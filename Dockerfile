# Use Node.js version as build arg for consistency
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate OpenAPI types
RUN npm run postinstall

# Build the application
RUN npm run build

# Production stage
FROM node:${NODE_VERSION}-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create entrypoint script for runtime UID/GID handling
RUN cat > /entrypoint.sh << 'EOF'
#!/bin/sh
set -e

# Set default UID/GID if not provided
PUID=${PUID:-1001}
PGID=${PGID:-1001}

# Create group with specified GID or use existing group
if getent group ${PGID} >/dev/null 2>&1; then
    GROUP_NAME=$(getent group ${PGID} | cut -d: -f1)
else
    addgroup -g ${PGID} -S nodejs
    GROUP_NAME="nodejs"
fi

# Create user with specified UID or use existing user  
if getent passwd ${PUID} >/dev/null 2>&1; then
    USER_NAME=$(getent passwd ${PUID} | cut -d: -f1)
else
    adduser -S nodejs -u ${PUID} -G ${GROUP_NAME}
    USER_NAME="nodejs"
fi

# Ensure the user owns the app directory
chown -R ${USER_NAME}:${GROUP_NAME} /app

# Execute the command as the specified user
exec su-exec ${USER_NAME} "$@"
EOF

RUN chmod +x /entrypoint.sh

# Install su-exec for dropping privileges
RUN apk add --no-cache su-exec

# Copy built application from builder stage
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application with entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]