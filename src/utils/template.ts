import Mustache, { TemplateSpans } from "mustache";
import { Clipboard, getSelectedText } from "@raycast/api";
import { getBrowserContent } from "./browser";

export async function renders(template: string) {
  Mustache.templateCache = undefined;

  const tags = new Set<string>();

  const spans = Mustache.parse(template);
  visitor(spans, tags);
  const view = await handler(tags);
  return [Mustache.render(template, view), Object.values(view)[0]];
}

function visitor(spans: TemplateSpans, ctx: Set<string>) {
  for (const span of spans) {
    if (span[0] === "name") {
      ctx.add(span[1]);
    } else if (span[0] === "#") {
      ctx.add(span[1]);
      visitor(span[4] as TemplateSpans, ctx);
    } else if (span[0] === "^") {
      visitor(span[4] as TemplateSpans, ctx);
    }
  }
}

async function handler(ctx: Set<string>) {
  const view: { [k: string]: string } = {};
  for (const key of ctx) {
    if (key === "select" || key === "selectText" || key === "selection") {
      view[key] = await getSelectedText();
    } else if (key === "clipboard" || key === "clipboardText") {
      view[key] = (await Clipboard.readText()) || "";
    } else if (key.startsWith("content")) {
      view[key] = await getBrowserContent(key);
    }
  }
  return view;
}
