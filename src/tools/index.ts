import { toTool, ZodFunctionDef } from "openai-zod-functions";
import OpenAI from "openai";
import { Message, Model } from "../type";
import SearchTool from "./search";
import fetch from "cross-fetch";
import WebsiteTool from "./website";
import { EventEmitter } from "node:events";
import WeatherTool from "./weather";

export interface Tool<T> {
  define: () => ZodFunctionDef<T>;
  execute: (input: T) => PromiseLike<string>;
}

class Core {
  readonly tools: Tool<unknown>[] = [];
  readonly eventEmitter = new EventEmitter();

  constructor(private openAI: OpenAI, private model: Model) {}

  _register: (tool: Tool<unknown>) => void = (tool) => {
    const name = this.model.enableFunctions?.find((f) => f === tool.define().name);
    if (name) {
      this.tools.push(tool);
    }
  };

  public onTrigger(listener: (msg: string) => void) {
    this.eventEmitter.on("trigger", listener);
  }

  private count = 0;
  private timerId: NodeJS.Timeout | null = null;

  _emit(msg: string) {
    this.timerId && clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.eventEmitter.emit("trigger", `${msg}${".".repeat((this.count++ % 3) + 1)}`);
    }, 600);
  }

  public call: (query: Message) => PromiseLike<Message[] | null> = async (query) => {
    if (this.tools.length === 0) {
      return null;
    }
    try {
      this._emit("Detecting tools");
      const response = await this.openAI.chat.completions.create({
        model: this.model.option,
        temperature: Number(this.model.temperature),
        messages: [query],
        tools: this.tools.map((t) => toTool(t.define())),
        tool_choice: "auto",
      });
      const responseMessage = response.choices[0].message;
      const toolCalls = responseMessage.tool_calls;
      const messages: Message[] = [];
      if (toolCalls) {
        // console.log(responseMessage);
        messages.push(responseMessage);
        for (const toolCall of toolCalls) {
          this._emit(`Executing ${toolCall.function.name} with ${toolCall.function.arguments}`);
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
    } finally {
      // clear
      this.timerId && clearInterval(this.timerId);
      this.eventEmitter.removeAllListeners();
    }
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const supportTools: Tool<any>[] = [new SearchTool(), new WebsiteTool(), new WeatherTool()];

export default function (openAI: OpenAI, model: Model) {
  global.fetch = fetch;
  const tools = new Core(openAI, model);
  for (const supportTool of supportTools) {
    tools._register(supportTool);
  }
  return tools;
}
