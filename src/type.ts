import React from "react";
import { type ChatCompletionMessageParam, type ImageGenerateParams } from "openai/resources";

export type OpenAIImageGenerateParams = ImageGenerateParams;

export type Set<T> = React.Dispatch<React.SetStateAction<T>>;

export type Message = ChatCompletionMessageParam;

export interface Question {
  id: string;
  question: string;
  files: string[];
  created_at: string;
}

export interface Chat extends Question {
  answer: string;
  tools?: [string, string][];
}

export interface SavedChat extends Chat {
  saved_at?: string;
}

export interface Conversation {
  id: string;
  model: Model;
  chats: Chat[];
  updated_at: string;
  created_at: string;
  pinned: boolean;
}

export interface Model {
  id: string;
  updated_at: string;
  created_at: string;
  name: string;
  prompt: string;
  option: "gpt-3.5-turbo" | "gpt-3.5-turbo-0301" | "gpt-4" | "gpt-4-0314" | "gpt-4-32k" | "gpt-4-32k-0314" | string;
  temperature: string;
  pinned: boolean;
  vision?: boolean;
  enableFunctions?: string[];
}

type PromiseFunctionNoArg = () => Promise<void>;
type PromiseFunctionWithOneArg<T> = (arg: T) => Promise<void>;
// type PromiseFunctionWithTwoArg<T, V> = (arg_1: T, arg_2: V) => Promise<void>;
type PromiseFunctionWithThreeArg<T, V, W> = (arg_1: T, arg_2: V, arg_3: W) => Promise<void>;

interface BaseFunctionHook<T> {
  add: PromiseFunctionWithOneArg<T>;
  remove: PromiseFunctionWithOneArg<T>;
  clear: PromiseFunctionNoArg;
}

interface BaseHook<T> {
  data: T;
  isLoading: boolean;
}

type Hook<T> = BaseHook<T[]> & BaseFunctionHook<T>;

export type HistoryHook = Hook<Chat>;

export type SavedChatHook = Hook<SavedChat>;

export type ConversationsHook = Hook<Conversation> & { update: PromiseFunctionWithOneArg<Conversation> };

export type QuestionHook = BaseHook<string> & { update: PromiseFunctionWithOneArg<string> };

export type ModelHook = Hook<Model> & {
  update: PromiseFunctionWithOneArg<Model>;
  option: Model["option"][];
  isFetching: boolean;
};

export interface ChatHook {
  data: Chat[];
  setData: Set<Chat[]>;
  isLoading: boolean;
  setLoading: Set<boolean>;
  selectedChatId: string | null;
  setSelectedChatId: Set<string | null>;
  ask: PromiseFunctionWithThreeArg<string, string[], Model>;
  clear: PromiseFunctionNoArg;
  streamData: Chat | undefined;
  historyIsLoading: boolean;
}

export interface ChangeModelProp {
  models: Model[];
  selectedModel: string;
  onModelChange: Set<string>;
}

export interface QuestionFormProps extends ChangeModelProp {
  initialQuestion: string;
  onSubmit: (question: string, files: string[]) => void;
  isFirstCall?: boolean;
}

export interface ChatViewProps extends ChangeModelProp {
  data: Chat[];
  question: string;
  isAutoSaveConversation: boolean;
  conversation: Conversation;
  setConversation: Set<Conversation>;
  use: { chats: ChatHook; conversations: ConversationsHook; savedChats: SavedChatHook };
}

export interface CSVPrompt {
  act: string;
  prompt: string;
}

export type GenerateImageParams = {
  prompt: string;
  model: string;
  size: string;
  n: string;
  style: string | undefined;
};

export interface GenerateImage {
  b64_json?: string;
  revised_prompt?: string;
  url: string;
}

export interface StoredImage {
  prompt: string;
  date: Date;
  size: string;
  model: string;
  images: GenerateImage[];
}
