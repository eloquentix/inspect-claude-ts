.PHONY: clean build run package install-ext

clean:
	pnpm clean

build:
	pnpm build

run: build
	node packages/cli/dist/index.js $(ARGS)

package: build
	cd packages/vscode && npx @vscode/vsce package --no-dependencies --allow-missing-repository -o inspect-claude.vsix

install-ext: package
	code --install-extension packages/vscode/inspect-claude.vsix
