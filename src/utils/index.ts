import { Chat, Message, Model } from "../type";
import path from "node:path";
import * as fs from "node:fs";
import OpenAI from "openai/index";
import ChatCompletionContentPart = OpenAI.ChatCompletionContentPart;
import { TikTokenClass } from "./tikToken";

export function chatTransformer(model: Model, chat: Chat[]): Message[] {
  const messages: Message[] = [{ role: "system", content: model.prompt }];
  const util = new TikTokenClass(model.option);
  const limitedChat = util.limitConversationLength(chat);
  limitedChat.forEach(({ question, answer }) => {
    messages.push({ role: "user", content: question });
    messages.push({
      role: "assistant",
      content: answer,
    });
  });
  return messages;
}

export const getConfigUrl = (params: Preferences) => {
  if (params.useAzure) return params.azureEndpoint + "/openai/deployments/" + params.azureDeployment;
  if (params.useApiEndpoint) return params.apiEndpoint;
  return "https://api.openai.com/v1";
};

export const checkFileValidity = (file: string): boolean => {
  const fileExtension = path.extname(file);
  if (file.startsWith("http") && supportImageFormats.includes(fileExtension)) {
    return true;
  }

  const acceptedFileExtensions = Object.keys(formats);
  return acceptedFileExtensions.includes(fileExtension);
};

// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
export const formats: { [K: string]: string } = {
  ".png": "image/png",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export const supportImageFormats = Object.keys(formats);

export const imgFormat = (file: string) => {
  if (file.startsWith("http")) {
    return file;
  }
  const fileExtension = path.extname(file);
  let type = formats[fileExtension];
  if (!type) {
    // guess it from the clipboard
    type = formats[".png"];
  }
  // file:///var/folders/vx/xs9f3rcj74d2wlp32sz0t0h80000gn/T/Image%20(1772x1172)
  const replace = file.replace("file://", "").replace("%20", " ");
  // data:image/jpeg;base64,{base64_image}
  return `data:${type};base64,${fs.readFileSync(replace).toString("base64")}`;
};

export const buildUserMessage = (question: string, files: string[]) => {
  const content: ChatCompletionContentPart[] = [
    {
      type: "text",
      text: question,
    },
  ];

  files.forEach((img) => {
    content.push({
      type: "image_url",
      image_url: {
        // Format images to base64
        url: imgFormat(img),
      },
    });
  });
  return content;
};
