.PHONY: build
build:
	mkdir -p bin
	rm -f bin/app
	npm run build
	cp meta.json bin/meta.json
	cp app bin/app

.PHONY: run
run:
	docker compose -f docker-compose.yml down
	docker build --target harness -t tiny_url_ts .
	docker compose -f docker-compose.yml up --abort-on-container-exit --exit-code-from app

.PHONY: run-local
run-local:
	docker compose down
	docker compose build
	docker compose up --abort-on-container-exit --exit-code-from app