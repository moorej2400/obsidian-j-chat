# Agent Instructions

## OpenClaw Vault Deployment

The target Obsidian vault is:

```text
/Users/jaredmoore/Library/Mobile Documents/iCloud~md~obsidian/Documents/openclaw-vault
```

After every plugin code change, build a standalone plugin bundle and copy only the runtime artifacts into the vault plugin folder. The deployed plugin must not require `node_modules` or any other repository dependency.

```bash
npm run build
PLUGIN_DIR="/Users/jaredmoore/Library/Mobile Documents/iCloud~md~obsidian/Documents/openclaw-vault/.obsidian/plugins/j-chat"
mkdir -p "$PLUGIN_DIR"
cp main.js styles.css manifest.json "$PLUGIN_DIR"
```

Use the Obsidian CLI as needed for plugin debugging, reloads, errors, screenshots, DOM inspection, or vault checks. Common commands:

```bash
obsidian plugin:reload id=j-chat vault="openclaw-vault"
obsidian dev:errors vault="openclaw-vault"
obsidian dev:console level=error vault="openclaw-vault"
```

If `plugin:reload` reports the plugin is not found, verify the plugin is enabled in Obsidian after the files are copied.

