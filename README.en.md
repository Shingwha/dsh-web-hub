# dsh-web-hub

[中文](README.md) | English

Give the model search and fetch tools: **which service, which tools, where the key goes** — all in one panel.

Every service keeps its own tools, parameters and descriptions; the plugin only mounts them and decides, per switch, whether the model can see them.

## Requirements

- DeepSeek Harness `>= 0.2.2-rc.3` (the build with the web GUI)
- No extra runtime; an API key is optional

## Install

### From GitHub (recommended)

1. Open **Plugins** in the DSH sidebar.
2. Click **Add plugin**.
3. Enter this and confirm:

   ```
   github:Shingwha/dsh-web-hub
   ```

4. Wait for the install to finish (the first run fetches dependencies).
5. **Reload the page** so the browser loads the panel code.

When it is done, **dsh-web-hub** appears in the Plugins list with status *running*.

### From a local tarball (development)

```sh
npm pack
```

Pass the **absolute path** of the generated `dsh-web-hub-<version>.tgz` to Add plugin.

Do not select the plugin directory: pnpm installs a directory as a `link:` and the
`@deepseek-ai/*` dependencies then fail to resolve.

## After installing

The plugin takes effect immediately:

- The model gains `anysearch_search` and `anysearch_extract`.
- The built-in `web_search` / `web_fetch` are **hidden**, so two search stacks do not compete.

To keep the built-in tools, open **Plugins → dsh-web-hub** and turn off
"Hide web_search / web_fetch from the official plugins".

Verify: start a new session and ask the model to search something; it should call
`anysearch_search` rather than `web_search`.

## Configuration

Open **Plugins → dsh-web-hub**:

1. **Source** — pick one service; "Turn off" mounts no tools at all.
2. **Tools** — `search` and `extract` are on by default; enable the rest as needed.
3. **Key (optional)** — leave it empty for anonymous calls at a lower rate limit;
   "Get an API key" opens the provider's console.

Switches and the source selection apply instantly; a key is saved with the button.

## Supported providers

| Provider | Search | Extract | Works without a key |
|---|---|---|---|
| **AnySearch** | ✅ | ✅ | ✅ anonymous, lower limits |
| **Exa** | ✅ | ✅ | ✅ |
| **Tavily** | ✅ | ✅ | ✅ daily allowance, then needs a key |
| **Firecrawl** | ⚠️ search needs a key | ✅ | extraction is keyless |

Exactly one provider is active at a time; the model sees the new tool set on its next step.

## What each switch does

| Switch | Effect |
|---|---|
| Source | Mounts that service's tools so the model can call them on its next step |
| Tool switch | A tool that is off never enters the model context and costs no tokens |
| Hide built-in web tools | Masks `web_search` / `web_fetch` provided by the official plugins |

## Uninstall

Disable or remove **dsh-web-hub** in Plugins:

- Every tool it mounted disappears.
- The hidden built-in web tools come back.
- No other configuration needs to change.

## Add a provider

Drop a file into `src/adapters/` declaring that provider's own tools, then register it in
`src/adapters/index.js`. Neither the core nor the panel changes. See [docs/DETAIL.md](docs/DETAIL.md).

## License

MIT
