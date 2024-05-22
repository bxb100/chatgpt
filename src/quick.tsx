import { ConfigProvider, useConfig } from "./hooks/ConfigContext";
import { useEffect, useState } from "react";
import { popToRoot, showHUD } from "@raycast/api";
import { IAction } from "./constants/initialActions";
import ResultPage from "./components/ResultPage";
import { DEFAULT_MODEL, useModel } from "./hooks/useModel";

export default function Command() {
  return (
    <ConfigProvider>
      <Quick />
    </ConfigProvider>
  );
}

function Quick() {
  const { isLoading, defaultAction, initIsLoading } = useConfig();
  const [action, setAction] = useState<IAction | null>(null);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const { isLoading: modelLoading, data } = useModel();

  useEffect(() => {
    if (isLoading || modelLoading || initIsLoading) {
      return;
    }
    const action = defaultAction();

    if (action == undefined) {
      showHUD("No default action found, Please set one in the action");
      popToRoot({ clearSearchBar: true });
      return;
    }

    setModel(data.find((m) => m.id === action.modelId) || DEFAULT_MODEL);
    setAction(action);
  }, [isLoading, initIsLoading, modelLoading]);

  return action ? <ResultPage action={action} model={model} /> : <></>;
}
