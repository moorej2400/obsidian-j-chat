# Agent Instructions

## Example Vault Deployment

The target Obsidian vault is:

```text
/path/to/vault
```

After every plugin code change, build a standalone plugin bundle and copy only the runtime artifacts into the vault plugin folder. The deployed plugin must not require `node_modules` or any other repository dependency.

```bash
npm run build
PLUGIN_DIR="/path/to/vault/.obsidian/plugins/j-chat"
mkdir -p "$PLUGIN_DIR"
cp main.js styles.css manifest.json "$PLUGIN_DIR"
```

Use the Obsidian CLI as needed for plugin debugging, reloads, errors, screenshots, DOM inspection, or vault checks. Common commands:

```bash
obsidian plugin:reload id=j-chat vault="example-vault"
obsidian dev:errors vault="example-vault"
obsidian dev:console level=error vault="example-vault"
```

If `plugin:reload` reports the plugin is not found, verify the plugin is enabled in Obsidian after the files are copied.

