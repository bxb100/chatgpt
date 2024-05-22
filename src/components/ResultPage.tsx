import { Action, ActionPanel, Detail, getSelectedText, useNavigation } from "@raycast/api";
import { IAction } from "../constants/initialActions";
import { useEffect, useMemo, useState } from "react";
import { getBrowserContent } from "../utils/browser";
import { Chat, Model } from "../type";
import { showFailureToast } from "@raycast/utils";
import { useChat } from "../hooks/useChat";

interface ResultPageProps {
  action: IAction;
  model: Model;
}

export default function ResultPage({ action, model }: ResultPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const chat = useChat<Chat>([]);

  const markdown = useMemo(() => {
    const isStream = chat.streamData && chat.streamData.id === chat.selectedChatId;
    return `## ${action.title}\n\n${isStream ? chat.streamData?.answer : chat.data[0]?.answer || "Loading..."}`;
  }, [chat.streamData, chat.selectedChatId, chat.isLoading]);

  useEffect(() => {
    if (chat.historyIsLoading) {
      return;
    }
    setIsLoading(true);
    (async () => {
      try {
        let text: string;
        if (action.useRaycastExtension) {
          text = await getBrowserContent(action.prompt);
        } else {
          text = action.prompt + (await getSelectedText());
        }
        await chat.ask(text, [], model);
      } catch (error) {
        await showFailureToast(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [chat.historyIsLoading]);

  const { pop } = useNavigation();

  return (
    <Detail
      isLoading={isLoading || chat.isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={markdown || ""} onCopy={() => pop()} />
        </ActionPanel>
      }
    />
  );
}
