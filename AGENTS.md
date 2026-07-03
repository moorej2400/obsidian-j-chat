# Agent Instructions

> **This repository is public.** Never add secrets, API keys, local filesystem paths, or any other private information to this file or any other tracked file.
> **Read `AGENTS.local.md` first** if it exists. It is git-ignored and contains private, machine-specific configuration (for example, the local Obsidian vault deployment path and vault name). Treat its contents as secret and never copy them into tracked files.

## Obsidian Vault Deployment

After every plugin code change, build a standalone plugin bundle and copy only the runtime artifacts into the vault plugin folder. The deployed plugin must not require `node_modules` or any other repository dependency.

The exact vault path and vault name are local/private configuration. Use the `PLUGIN_DIR` and vault name defined in `AGENTS.local.md`. If `AGENTS.local.md` is missing, ask the user for the vault path and vault name before deploying.

```bash
npm run build
# PLUGIN_DIR is the absolute path to the target vault's .obsidian/plugins/j-chat folder
mkdir -p "$PLUGIN_DIR"
cp main.js styles.css manifest.json "$PLUGIN_DIR"
rm -rf "$PLUGIN_DIR/codex-runtime"
cp -R codex-runtime "$PLUGIN_DIR/codex-runtime"
```

Use the Obsidian CLI as needed for plugin debugging, reloads, errors, screenshots, DOM inspection, or vault checks. Replace `<VAULT_NAME>` with the vault name from `AGENTS.local.md`. Common commands:

```bash
obsidian plugin:reload id=j-chat vault="<VAULT_NAME>"
obsidian dev:errors vault="<VAULT_NAME>"
obsidian dev:console level=error vault="<VAULT_NAME>"
```

If `plugin:reload` reports the plugin is not found, verify the plugin is enabled in Obsidian after the files are copied.