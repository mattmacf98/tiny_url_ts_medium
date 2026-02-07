FROM mattmacf98/tiny_url_harness:latest

# Install Node.js and npm
RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app
COPY . .

RUN npm install
RUN make build

CMD ["/app/harness/bin/app"]
