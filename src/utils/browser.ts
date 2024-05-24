import { BrowserExtension, environment } from "@raycast/api";
import { YoutubeTranscript } from "youtube-transcript";
import fetch from "cross-fetch";

export function canAccessBrowserExtension() {
  return environment.canAccess(BrowserExtension);
}

// https://i.stack.imgur.com/g2X8z.gif
const ASCII_TABLES = Object.entries({
  "&amp;": "&",
  "&#32;": " ",
  "&#33;": "!",
  "&#34;": '"',
  "&#35;": "#",
  "&#36;": "$",
  "&#37;": "%",
  "&#38;": "&",
  "&#39;": "'",
  "&#40;": "(",
  "&#41;": ")",
  "&#42;": "*",
  "&#43;": "+",
  "&#44;": ",",
  "&#45;": "-",
  "&#46;": ".",
  "&#47;": "/",
  "&#91;": "[",
  "&#92;": "\\",
  "&#93;": "]",
  "&#94;": "^",
  "&#95;": "_",
  "&#96;": "`",
  "&#123;": "{",
  "&#124;": "|",
  "&#125;": "}",
  "&#126;": "~",
});

export async function getBrowserContent(prompt: string): Promise<string> {
  if (!canAccessBrowserExtension()) {
    throw new Error("Browser extension is not available");
  }

  const tabs = await BrowserExtension.getTabs();
  const activeTab = (tabs.filter((tab) => tab.active) || [])[0];

  let content: string;
  if (activeTab && activeTab.url.startsWith("https://www.youtube.com/watch?v=")) {
    global.fetch = fetch;
    // not official API, so it may break in the future
    content = await YoutubeTranscript.fetchTranscript(activeTab.url, {
      lang: "en",
    }).then((transcript) => {
      return transcript.map((item) => item.text).join("\n");
    });
  } else {
    content = await dynamicExecution(prompt);
  }
  return ASCII_TABLES.reduce((acc, [key, value]) => {
    return acc.replaceAll(key, value);
  }, content);
}

const regex =
  /content\s*(format="(?<format>markdown|text|html)")?\s*(cssSelector="(?<cssSelector>.+)")?\s*(tabId=(?<tabId>\d+))?/gm;

/**
 * dynamic execution by the tag
 * e.g.
 * {{ content }} default to Markdown format
 * {{ content format="markdown" }}
 * {{ content format="html" }}
 * {{ content format="text" cssSelector="h1" }}
 * {{ content tabId=1 }}
 *
 * @param prompt
 */
async function dynamicExecution(prompt: string) {
  let result = prompt;
  for (const m of prompt.matchAll(regex)) {
    if (m) {
      const groups = m.groups;
      if (groups) {
        const { format, cssSelector, tabId } = groups;
        const content = await BrowserExtension.getContent({
          format: format ? (format as "markdown" | "text" | "html") : "markdown",
          cssSelector: cssSelector ? cssSelector : undefined,
          tabId: tabId ? parseInt(tabId) : undefined,
        });
        result = result.replace(m[0], content);
      }
    }
  }
  return result;
}
