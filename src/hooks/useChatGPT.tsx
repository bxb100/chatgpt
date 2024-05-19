import { getPreferenceValues } from "@raycast/api";
import OpenAI from "openai";
import { useState } from "react";
import { getConfigUrl } from "../utils";

export function useChatGPT(): OpenAI {
  const [chatGPT] = useState(() => {
    const preferences = getPreferenceValues<Preferences>();

    return buildOpenAI(preferences.apiKey, getConfigUrl(preferences));
  });
  return chatGPT;
}

export function buildOpenAI(apiKey: string, baseURL: string | undefined): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL,
  });
}

export function getConfiguration(): Preferences {
  return getPreferenceValues<Preferences>();
}
