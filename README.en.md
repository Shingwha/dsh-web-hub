# dsh-web-hub

[中文](README.md) | English

Search and fetch tools for DeepSeek Harness: **one switchboard decides what the model sees**, and a provider is only a group of tools.

Search from one service, fetch with another, or mix in the built-in official tools — any combination works.

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

### From a local tarball (development)

```sh
npm pack
```

Pass the **absolute path** of the generated `dsh-web-hub-<version>.tgz` to Add plugin.

Do not select the plugin directory: pnpm installs a directory as a `link:` and the
`@deepseek-ai/*` dependencies then fail to resolve.

## After installing

- **Nothing changes**: the built-in `web_search` / `web_fetch` stay on, and the plugin
  does not take over.
- Every provider tool starts **off**; turn on the ones you want.

Installing therefore never breaks the search and fetch you already had.

## Configuration

Open **Plugins → dsh-web-hub**. The panel groups tools by provider:

```
Tools                                       2/13
Built-in
  web_search      [✓]    web_fetch      [✓]
AnySearch        key set
  anysearch_search [ ]   anysearch_extract [ ]
  Key ANYSEARCH_API_KEY · key set      Get an API key  [Clear]
Exa              no key
  exa_search      [ ]    exa_extract   [ ]
  Key EXA_API_KEY · no key             Get an API key  [____] [Save]
…
```

- **Switch**: on means the model can call it on its next step; off removes it from the
  tool list and costs no tokens.
- **Key**: lives inside its provider group and is optional. Empty means anonymous or
  keyless access; "Get an API key" opens the provider console.
- Keys are stored in the local credential store; the config keeps only the reference name.

## Supported providers

| Provider | Search | Extract | Works without a key |
|---|---|---|---|
| **AnySearch** | ✅ | ✅ | ✅ anonymous, lower limits |
| **Exa** | ✅ | ✅ | ✅ |
| **Tavily** | ✅ | ✅ | ✅ daily allowance, then needs a key |
| **Firecrawl** | ⚠️ search needs a key | ✅ | extraction is keyless |

## Uninstall

Disable or remove **dsh-web-hub** in Plugins:

- Every tool it mounted disappears.
- The built-in web tools it switched off come back.
- No other configuration needs to change.

## Add a provider

Drop a file into `src/adapters/` declaring that provider's own tools, then register it in
`src/adapters/index.js`. Neither the core nor the panel changes. See [docs/DETAIL.md](docs/DETAIL.md).

## License

MIT
