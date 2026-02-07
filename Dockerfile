# ============ Local development ============
FROM ubuntu:22.04 AS local
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["node", "bin/main.js"]

# ============ Harness testing ============
FROM mattmacf98/tiny_url_harness:latest AS harness
RUN apt-get update && apt-get install -y nodejs npm
WORKDIR /app
COPY . .
RUN npm install && make build
CMD ["/app/harness/bin/app"]
