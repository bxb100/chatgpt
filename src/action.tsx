import { ConfigProvider, useConfig } from "./hooks/ConfigContext";
import { Action, ActionPanel, Icon, Keyboard, List } from "@raycast/api";
import { ActionItem } from "./components/ActionItem";
import MergeActionForm from "./components/MergeActionForm";

function ActionsList() {
  const { value, isLoading, addAction } = useConfig();

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={(value?.length || 0) > 0}
      actions={
        <ActionPanel>
          <Action.Push
            title="Add New Action"
            target={<MergeActionForm addAction={addAction} />}
            shortcut={Keyboard.Shortcut.Common.New}
            icon={Icon.Plus}
          />
        </ActionPanel>
      }
    >
      {(value || []).map((item) => (
        <ActionItem key={item.id} item={item} />
      ))}
    </List>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <ActionsList />
    </ConfigProvider>
  );
}
