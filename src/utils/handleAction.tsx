import { showHUD, showToast, Toast } from "@raycast/api";
import ResultPage from "../components/ResultPage";
import { IAction } from "../constants/initialActions";
import { canAccessBrowserExtension } from "./browser";
import { Model } from "../type";
import React from "react";

async function handleAction(action: IAction, push: (element: React.JSX.Element) => void, model: Model) {
  const toast = await showToast(Toast.Style.Animated, `Executing ${action.title}`);

  try {
    if (action.useRaycastExtension && !canAccessBrowserExtension()) {
      await showHUD("The raycast browser extension not install");
      toast.style = Toast.Style.Failure;
      toast.message = `Failed to execute ${action.title}`;
      return;
    }
    push(<ResultPage action={action} model={model} />);
    toast.style = Toast.Style.Success;
    toast.message = `${action.title} Executed`;
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.message = `Failed to execute ${action.title}`;
  }
}

export default handleAction;
