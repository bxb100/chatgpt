import { showToast, Toast } from "@raycast/api";
import { IAction } from "../constants/initialActions";
import { showFailureToast } from "@raycast/utils";
import { renders } from "./template";

async function handleAction(
  action: IAction,
  callback: (texts: string[]) => void | PromiseLike<void>,
  onFail?: (error: unknown) => void | PromiseLike<void>
) {
  const toast = await showToast(Toast.Style.Animated, `Executing ${action.title}`);

  try {
    const texts = await renders(action.prompt);
    callback(texts);
    toast.style = Toast.Style.Success;
    toast.message = `${action.title} Executed`;
  } catch (error) {
    onFail && onFail(error);
    await showFailureToast(error, { title: `Failed to execute ${action.title}` });
  }
}

export default handleAction;
