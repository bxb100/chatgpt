import { toTool, ZodFunctionDef } from "openai-zod-functions";
import OpenAI from "openai";
import { Model } from "../type";
import { ChatCompletionMessageParam, ChatCompletionUserMessageParam } from "openai/src/resources/chat/completions";
import SearchTool from "./search";
import fetch from "cross-fetch";
import WebsiteTool from "./website";

export interface Tool<T> {
  define: () => ZodFunctionDef<T>;
  execute: (input: T) => PromiseLike<string>;
}

class Core {
  readonly tools: Tool<unknown>[] = [];

  constructor(private openAI: OpenAI, private model: Model) {}

  _register: (tool: Tool<unknown>) => void = (tool) => {
    const name = this.model.enableFunctions?.find((f) => f === tool.define().name);
    if (name) {
      this.tools.push(tool);
    }
  };

  public call: (query: ChatCompletionUserMessageParam) => PromiseLike<ChatCompletionMessageParam[] | null> = async (
    query
  ) => {
    if (this.tools.length === 0) {
      return null;
    }
    const response = await this.openAI.chat.completions.create({
      model: this.model.option,
      temperature: Number(this.model.temperature),
      messages: [query],
      tools: this.tools.map((t) => toTool(t.define())),
      tool_choice: "auto",
    });
    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;
    const messages: ChatCompletionMessageParam[] = [];
    if (toolCalls) {
      console.log(responseMessage);
      messages.push(responseMessage);
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = this.tools.find((t) => t.define().name === functionName);
        if (functionToCall === undefined) {
          continue;
        }
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const functionResponse = await functionToCall.execute(functionArgs);
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: functionResponse,
        });
      }
    }
    return messages;
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const supportTools: Tool<any>[] = [new SearchTool(), new WebsiteTool()];

export default function (openAI: OpenAI, model: Model) {
  global.fetch = fetch;
  const tools = new Core(openAI, model);
  for (const supportTool of supportTools) {
    tools._register(supportTool);
  }
  return tools;
}
