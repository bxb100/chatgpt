import { getSelectedText, showToast, Toast } from "@raycast/api";
import { IAction } from "../constants/initialActions";
import { getBrowserContent } from "./browser";
import { showFailureToast } from "@raycast/utils";

async function handleAction(
  action: IAction,
  callback: (text: string) => void | PromiseLike<void>,
  onFail?: (error: unknown) => void | PromiseLike<void>
) {
  const toast = await showToast(Toast.Style.Animated, `Executing ${action.title}`);

  try {
    const text = await getText(action);
    callback(text);
    toast.style = Toast.Style.Success;
    toast.message = `${action.title} Executed`;
  } catch (error) {
    onFail && onFail(error);
    await showFailureToast(error, { title: `Failed to execute ${action.title}` });
  }
}

export async function getText(action: IAction) {
  let text: string;
  if (action.useRaycastExtension) {
    text = await getBrowserContent(action.prompt);
  } else {
    text = action.prompt + (await getSelectedText());
  }
  return text;
}

export default handleAction;
