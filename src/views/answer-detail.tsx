import { List } from "@raycast/api";
import { Chat } from "../type";

export const AnswerDetailView = (props: { chat: Chat; streamData?: Chat | undefined }) => {
  const { chat, streamData } = props;
  const isStreaming = streamData && streamData.id === chat.id;

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

  const markdown = `### Answer\n${
    (isStreaming ? streamData?.answer : chat.answer) || "Loading..."
  }\n\n---\n\n### Question\n${chat.question.trimEnd()}\n${images}\n\n`;

  return <List.Item.Detail markdown={markdown} />;
};
