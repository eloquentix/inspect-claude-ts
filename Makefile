.PHONY: clean build run

clean:
	pnpm clean

build:
	pnpm build

run: build
	node packages/cli/dist/index.js $(ARGS)
