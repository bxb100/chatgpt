import { Action, ActionPanel, Color, Icon, Keyboard, List, useNavigation } from "@raycast/api";
import MergeActionForm from "./MergeActionForm";
import { useConfig } from "../hooks/ConfigContext";
import { IAction } from "../constants/initialActions";
import React, { useEffect, useState } from "react";
import { DEFAULT_MODEL } from "../hooks/useModel";
import { Model } from "../type";
import handleAction from "../utils/handleAction";

interface ActionItemProps {
  item: IAction;
}

export function ActionItem({ item }: ActionItemProps) {
  const { push } = useNavigation();

  const { addAction, deleteAction, setDefaultAction, modelData, updateAction } = useConfig();

  const [model, setModel] = useState<Model | undefined>();

  useEffect(() => {
    setModel(modelData.find((m) => m.id === item.modelId));
  }, [modelData, item.modelId]);

  return (
    <List.Item
      key={item.id}
      title={item.title}
      icon={Icon[item.icon as keyof typeof Icon]}
      accessories={item.default ? [{ icon: { source: Icon.CheckCircle, tintColor: Color.Green } }] : []}
      actions={
        <ActionPanel>
          <Action
            title="Ask GPT"
            onAction={() => handleAction(item, push, model || DEFAULT_MODEL)}
            icon={Icon.Play}
            shortcut={{
              modifiers: ["cmd"],
              key: "r",
            }}
          />
          <Action
            title={"Set Default"}
            onAction={() => {
              setDefaultAction(item.id);
            }}
            icon={Icon.Star}
            shortcut={Keyboard.Shortcut.Common.Pin}
          />

          <Action.Push
            title="Update Action"
            target={<MergeActionForm action={item} updateAction={updateAction} />}
            shortcut={Keyboard.Shortcut.Common.Edit}
            icon={Icon.Pencil}
          />

          <Action.Push
            title="Add New Action"
            target={<MergeActionForm addAction={addAction} />}
            shortcut={Keyboard.Shortcut.Common.New}
            icon={Icon.Plus}
          />

          <Action
            title="Delete Action"
            style={Action.Style.Destructive}
            icon={Icon.Trash}
            onAction={() => {
              deleteAction(item.id);
            }}
            shortcut={Keyboard.Shortcut.Common.Remove}
          />
        </ActionPanel>
      }
      detail={
        <List.Item.Detail
          markdown={`### Description\n\n${item.description}\n\n### Prompt\n\n${item.prompt}`}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title={"id"} text={item.id} />
              <List.Item.Detail.Metadata.Label title={"title"} text={item.title} />
              <List.Item.Detail.Metadata.Label title={"icon"} text={item.icon} />
              <List.Item.Detail.Metadata.Label title={"model"} text={model?.option || DEFAULT_MODEL.option} />
            </List.Item.Detail.Metadata>
          }
        />
      }
    />
  );
}