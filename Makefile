.DEFAULT_GOAL := output

WEBPACK_MODE += production

clean:
	rm -rf node_modules
	rm -f deps dev-deps

deps:
	npm install
	touch deps

dev-deps:
	npm install --include=dev
	touch dev-deps

build: deps
	npx webpack --mode=production

output: build
	mkdir -p "$(OUTPUTDIR)"
	cp -a dist "$(OUTPUTDIR)"

develop: dev-deps
	npx webpack --mode=development

dev-serve: dev-deps
	npx webpack serve --mode=development

test: dev-deps
	npx jest
