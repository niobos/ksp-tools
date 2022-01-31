help:
	@echo 'Targets:'
	@echo '  clean      Clean all artifacts & dependencies'
	@echo '  dev-serve  Start a webserver with a development build'
	@echo '  develop    Build a development build in dist/'
	@echo '  test       Run tests'
	@echo '  build      Build a production build in dist/'
	@echo '  output     Render files for publication in $$(OUTPUTDIR)'

clean:
	rm -rf dist
	rm -rf node_modules
	rm -f deps dev-deps

deps:
	npm install

dev-deps:
	npm install --include=dev

build: deps
	rm -rf dist
	npx webpack --mode=production

output: clean build
	mkdir -p "$(OUTPUTDIR)"
	cp -a dist/. "$(OUTPUTDIR)"

develop: dev-deps
	npx webpack --mode=development

dev-serve: dev-deps
	npx webpack serve --mode=development

test: dev-deps
	npx jest
