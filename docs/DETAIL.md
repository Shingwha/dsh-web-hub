# dsh-web-hub

给模型挂上搜索与抓取工具，一块面板决定用哪个服务、开哪些工具。

## 配置

**Plugins → dsh-web-hub**：

1. **当前来源** — 用哪个服务；选「关闭」就不下发任何工具。内置 AnySearch、Exa、Tavily、Firecrawl 四个来源，均可免 key 使用（Firecrawl 的搜索除外）。
2. **工具开关** — 逐项勾选，没勾的不会进入模型上下文。
3. **API Key** — 可选。留空即匿名调用，填了限额更高。

保存后立即生效，模型的下一步就能看到变化。

## 行为

- 工具名是 `来源_工具`，例如 `anysearch_search`
- 「隐藏内置网页工具」会屏蔽 DSH 自带的 `web_search` / `web_fetch`
- 停用或卸载插件，工具与内置网页工具都自动恢复

## 加来源

`src/adapters/` 新增一个模块，声明自己的工具，再到 `src/adapters/index.js` 登记一行；核心与面板不用改。
