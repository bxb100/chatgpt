import { List } from "@raycast/api";
import { Chat } from "../type";
import { useEffect, useMemo, useState } from "react";
import { capitalization } from "../utils";

export const AnswerDetailView = (props: { chat: Chat; streamData?: Chat | undefined }) => {
  const { chat, streamData } = props;
  const isStreaming = useMemo(() => {
    return streamData && streamData.id === chat.id;
  }, [streamData?.id, chat.id]);

  const questionMd = useMemo(() => {
    const width = Math.floor(430 / Math.min(Math.max(chat.files.length, 1), 2));
    const images: string =
      chat.files
        ?.map((file) => {
          // presumptuous it is a website URI
          if (file.startsWith("http")) {
            return `![](${file})`;
          }
          return `![](file://${file}?raycast-width=${width})`;
        })
        .join("\n") || "";
    return `\n\n---\n\n### Question\n${chat.question.trimEnd()}\n${images}`;
  }, [isStreaming, chat.question, chat.files]);

  const functionMd = useMemo(() => {
    if (!chat.metadata) {
      return "";
    }
    const s = Object.entries(chat.metadata)
      .map(([k, v]) => {
        return `- **${capitalization(k)}**: ${v}`;
      })
      .join("\n");
    return "\n\n---\n\n### Function\n" + s;
  }, [chat.metadata]);

  const answerMd = useMemo(() => {
    return isStreaming ? streamData?.answer : chat.answer;
  }, [isStreaming, streamData?.answer, chat.answer]);

  const [loadingText, setLoadingText] = useState("Loading...");

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      setLoadingText("Loading" + ".".repeat((count++ % 3) + 1));
    }, 600);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return <List.Item.Detail markdown={`### Answer\n${answerMd || loadingText}${functionMd}${questionMd}`} />;
};
