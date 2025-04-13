build-MCPStreamableFunction:
	mkdir -p $(ARTIFACTS_DIR)
	cp -r src run.sh package.json package-lock.json tsconfig.json typescript-sdk esbuild.js $(ARTIFACTS_DIR)
	cd $(ARTIFACTS_DIR) && npm install && npm run setup && npm run build
	cd $(ARTIFACTS_DIR) && node esbuild.js
	cd $(ARTIFACTS_DIR) && rm -rf src package.json package-lock.json tsconfig.json typescript-sdk esbuild.js dist node_modules
	chmod +x $(ARTIFACTS_DIR)/run.sh
