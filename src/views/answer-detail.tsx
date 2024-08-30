import { List } from "@raycast/api";
import { Chat } from "../type";
import { useEffect, useMemo, useState } from "react";

export const AnswerDetailView = (props: { chat: Chat; streamData?: Chat | undefined }) => {
  const { chat, streamData } = props;
  const isStreaming = useMemo(() => {
    return streamData && streamData.id === chat.id;
  }, [streamData?.id, chat.id]);

  const questionMd = useMemo(() => {
    const width = Math.floor(430 / Math.min(Math.max(chat.files?.length ?? 0, 1), 2));
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
    return `---\n\n### Question\n${chat.question.trimEnd()}\n${images}`;
  }, [isStreaming, chat.question, chat.files]);

  const functionMd = useMemo(() => {
    if (!chat.tools || chat.tools.length === 0) {
      return "";
    }
    const s = chat.tools
      .map(([k, v]) => {
        return `- **${k}**: ${v}`;
      })
      .join("\n");
    return "---\n\n### Function\n" + s;
  }, [chat.tools]);

  const answerMd = useMemo(() => {
    return isStreaming ? streamData?.answer : chat.answer;
  }, [isStreaming, streamData?.answer, chat.answer]);

  const [loadingText, setLoadingText] = useState("Loading...");
  const [start, setStart] = useState(true);

  useEffect(() => {
    if (!start) {
      return;
    }
    let count = 0;
    const interval = setInterval(() => {
      setLoadingText("Loading" + ".".repeat((count++ % 3) + 1));
    }, 600);
    return () => {
      clearInterval(interval);
    };
  }, [start]);

  useEffect(() => {
    if (answerMd) {
      setStart(false);
    }
  }, [answerMd]);

  useEffect(() => {
    console.log(chat);
  }, []);

  const header = `### Answer\n\n${answerMd || loadingText}`;

  return <List.Item.Detail markdown={`${header}\n\n${functionMd}\n\n${questionMd}`} />;
};
