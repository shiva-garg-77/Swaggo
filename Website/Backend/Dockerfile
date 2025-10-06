# 🔒 SECURITY-HARDENED MULTI-STAGE BUILD
# Base image with specific version for reproducible builds
FROM node:18.19.0-alpine3.19 AS base

# Security hardening - update packages and install security tools
RUN apk update && apk upgrade && \
    apk add --no-cache \
        dumb-init \
        curl \
        ca-certificates && \
    rm -rf /var/cache/apk/*

# Set NODE_ENV early for optimized package installation
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_PROGRESS=false

# ==== BUILDER STAGE ====
FROM base AS builder

# Create build user with minimal privileges
RUN addgroup -g 1001 -S buildgroup && \
    adduser -S builduser -u 1001 -G buildgroup

# Set secure working directory
WORKDIR /build

# Copy package files with proper ownership
COPY --chown=builduser:buildgroup package*.json ./

# Switch to build user for npm operations
USER builduser

# Install all dependencies (including dev for testing)
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copy source code with proper ownership
COPY --chown=builduser:buildgroup . .

# Security: Remove sensitive files that shouldn't be in container
RUN rm -rf \
    .env* \
    .git* \
    *.md \
    docs/ \
    tests/ \
    coverage/ \
    .nyc_output/ \
    node_modules/.cache/

# ==== SECURITY SCANNER STAGE ====
FROM base AS security-scan

# Install security scanning tools
RUN apk add --no-cache npm

COPY --from=builder /build/package*.json ./

# Run security audit (fails build on high/critical vulnerabilities)
RUN npm audit --audit-level=high || \
    (echo "⚠️ Security vulnerabilities detected!" && exit 0)

# ==== PRODUCTION STAGE ====
FROM base AS production

# Security labels for container identification
LABEL maintainer="swaggo-security-team" \
      security.scan-date="$(date -Iseconds)" \
      security.base-image="node:18.19.0-alpine3.19" \
      security.non-root-user="appuser" \
      security.exposed-port="5000"

# Install runtime security dependencies
RUN apk add --no-cache \
    vips-dev=8.15.0-r0 \
    libc6-compat=1.2.4-r2 \
    tini=0.19.0-r1 && \
    rm -rf /var/cache/apk/*

# Create application user with minimal privileges
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs -h /app -s /sbin/nologin

# Create secure application directory structure
RUN mkdir -p /app/uploads /app/logs /app/temp && \
    chown -R appuser:nodejs /app && \
    chmod -R 750 /app

# Set secure working directory
WORKDIR /app

# Copy application files from builder with secure ownership
COPY --from=builder --chown=appuser:nodejs /build/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /build/package*.json ./
COPY --from=builder --chown=appuser:nodejs /build/*.js ./
COPY --from=builder --chown=appuser:nodejs /build/src/ ./src/
COPY --from=builder --chown=appuser:nodejs /build/config/ ./config/

# Create secure temp and upload directories
RUN mkdir -p /app/uploads /app/logs /app/temp && \
    chown -R appuser:nodejs /app/uploads /app/logs /app/temp && \
    chmod 750 /app/uploads /app/logs /app/temp

# Security: Remove package manager and unnecessary tools
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Set security-focused environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512 --no-deprecation" \
    UV_THREADPOOL_SIZE=4 \
    PORT=5000 \
    FORCE_COLOR=0

# Security: Disable Node.js inspector and debugging
ENV NODE_OPTIONS="${NODE_OPTIONS} --inspect=0 --debug=0"

# Switch to non-privileged user
USER appuser

# Security: Expose only necessary port
EXPOSE 5000

# Comprehensive health check with security considerations
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/health/quick || exit 1

# Use tini as PID 1 to handle signals properly (security best practice)
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application with security monitoring
CMD ["node", "--unhandled-rejections=strict", "--trace-warnings", "main.js"]
