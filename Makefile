.PHONY: build
build:
	mkdir -p bin
	rm -f bin/app
	npm run build
	cp meta.json bin/meta.json
	cp app bin/app

.PHONY: run
run:
	docker compose down
	docker build -t tiny_url_ts .
	docker compose up --abort-on-container-exit --exit-code-from app