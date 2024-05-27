import { Action, ActionPanel, Detail, useNavigation } from "@raycast/api";
import { IAction } from "../constants/initialActions";
import { useEffect, useMemo, useState } from "react";
import { Chat, Model } from "../type";
import { showFailureToast } from "@raycast/utils";
import { useChat } from "../hooks/useChat";
import { getDiffSvg } from "../utils/diff";

interface ResultPageProps {
  action: IAction;
  model: Model;
  texts: string[];
}

export default function ResultPage({ action, model, texts }: ResultPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const chat = useChat<Chat>([]);

  const returnedText = useMemo(() => {
    const isStream = chat.streamData && chat.streamData.id === chat.selectedChatId;
    return isStream ? chat.streamData?.answer : chat.data[0]?.answer;
  }, [chat.streamData, chat.selectedChatId, chat.isLoading]);

  useEffect(() => {
    if (chat.historyIsLoading) {
      return;
    }
    setIsLoading(true);
    (async () => {
      try {
        await chat.ask(texts[0], [], model);
      } catch (error) {
        await showFailureToast(error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [chat.historyIsLoading]);

  const [diffSvg, setDiffSvg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!action.showDiff) {
        return;
      }
      if (chat.isLoading || !returnedText) {
        return;
      }
      await getDiffSvg(texts[1], returnedText).then(setDiffSvg);
    })();
  }, [returnedText, chat.isLoading]);

  const { pop } = useNavigation();

  return (
    <Detail
      isLoading={isLoading || chat.isLoading}
      markdown={`## ${action.title}\n\n${returnedText || "Loading..."}${
        diffSvg ? "\n\n###### Diff  ![](" + diffSvg + ")" : ""
      }`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard content={returnedText || ""} onCopy={() => pop()} />
        </ActionPanel>
      }
    />
  );
}
