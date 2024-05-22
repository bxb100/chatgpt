import { exec, execSync } from "node:child_process";
import { Chat } from "../type";
import { homedir } from "node:os";

export class TikTokenClass {
  private readonly contextWindow: number = 3750;
  private exist: boolean = false;

  constructor(readonly model: string) {
    this.exist = Object.keys(CONTEXT_WINDOW).includes(model);
    exec(`command -v ${homedir()}/.cargo/bin/tiktoken-cli >/dev/null`, () => {
      this.exist = false;
    });
    this.contextWindow = CONTEXT_WINDOW[model] || this.contextWindow;
  }

  get maxTokens(): number {
    return this.contextWindow;
  }

  public numTokensFromText(text: string, role?: string): number {
    console.log(this.exist, this.contextWindow);
    if (!this.exist) {
      return this._countOpenAITokens(text);
    }
    try {
      const count = execSync(
        `${homedir()}/.cargo/bin/tiktoken-cli  --role ${role} --model ${this.model} --text '${text}'`,
        {
          encoding: "utf-8",
        }
      );
      return parseInt(count);
    } catch (_err) {
      this.exist = false;
      return this._countOpenAITokens(text);
    }
  }

  public limitConversationLength(chats: Chat[]): Chat[] {
    const maxTokens = this.maxTokens;
    const newChats: Chat[] = [];
    let tokens = 0;

    for (const chat of chats) {
      const questionTokens = this.numTokensFromText(chat.question, "user");
      const answerTokens = this.numTokensFromText(chat.answer, "assistant");

      tokens = tokens + questionTokens + answerTokens;

      if (tokens > maxTokens) {
        break;
      }

      newChats.push(chat);
    }

    return newChats;
  }

  /**
   * https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
   */
  private _countOpenAITokens(text: string): number {
    // 100 tokens ~= 75 words
    const words = text.split(" ").length;
    return Math.ceil(words / 75) * 100;
  }
}

/**
 * https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
 */
export const CONTEXT_WINDOW: Record<string, number> = {
  "gpt-4o": 128_000, // Currently points to gpt-4o-2024-05-13.
  "gpt-4o-2024-05-13": 128_000,
  "gpt-4-turbo": 128_000, // Currently points to gpt-4-turbo-2024-04-09.
  "gpt-4-turbo-2024-04-09": 128_000,
  "gpt-4-turbo-preview": 128_000, // Currently points to gpt-4-0125-preview.
  "gpt-4-0125-preview": 128_000,
  "gpt-4-1106-preview": 128_000,
  "gpt-4-vision-preview": 128_000,
  "gpt-4-1106-vision-preview": 128_000,
  "gpt-4": 8192, // Currently points to gpt-4-0613.
  "gpt-4-0613": 8192,
  "gpt-4-32k": 32_768, // Currently points to gpt-4-32k-0613.
  "gpt-4-32k-0613": 32_768,
  "gpt-3.5-turbo": 16_385, // Currently points to gpt-3.5-turbo-0125.
  "gpt-3.5-turbo-0125": 16_385,
  "gpt-3.5-turbo-1106": 16_385,
  "gpt-3.5-turbo-instruct": 4_096,
  "gpt-3.5-turbo-16k": 16_385, // @Deprecated
  "gpt-3.5-turbo-0613": 4_096, // @Deprecated
  "gpt-3.5-turbo-16k-0613": 16_385, // @Deprecated
};
