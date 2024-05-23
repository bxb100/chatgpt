import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { FormValidation, useFetch, useForm } from "@raycast/utils";
import { v4 as uuidv4 } from "uuid";
import { CSVPrompt, Model, ModelHook } from "../../type";
import { parse } from "csv-parse/sync";
import { useState } from "react";
import { getConfiguration } from "../../hooks/useChatGPT";
import { DEFAULT_MODEL } from "../../hooks/useModel";

export const ModelForm = (props: { model?: Model; use: { models: ModelHook }; name?: string }) => {
  const { use, model } = props;
  const { pop } = useNavigation();
  const { isCustomModel } = getConfiguration();

  const { handleSubmit, itemProps, setValue } = useForm<Model>({
    onSubmit: async (model) => {
      const updatedModel: Model = { ...model, updated_at: new Date().toISOString() };
      const toast = await showToast({
        title: `${props.model ? "Update" : "Save"} your model...`,
        style: Toast.Style.Animated,
      });
      if (props.model) {
        await use.models.update({ ...updatedModel, id: props.model.id, created_at: props.model.created_at });
      } else {
        await use.models.add({
          ...updatedModel,
          id: uuidv4(),
          created_at: new Date().toISOString(),
        });
      }
      toast.title = "Model saved!";
      toast.style = Toast.Style.Success;
      pop();
    },
    validation: {
      name: FormValidation.Required,
      temperature: (value) => {
        if (value) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            if (numValue < 0) {
              return "Minimal value is 0";
            } else if (numValue > 2) {
              return "Maximal value is 2";
            }
          }
        } else {
          return FormValidation.Required;
        }
      },
    },
    initialValues: {
      name: model?.name ?? "",
      temperature: model?.temperature.toString() ?? DEFAULT_MODEL.temperature,
      option: model?.option ?? DEFAULT_MODEL.option,
      prompt: model?.prompt ?? DEFAULT_MODEL.prompt,
      pinned: model?.pinned ?? false,
      vision: model?.vision ?? false,
    },
  });

  const MODEL_OPTIONS = use.models.option;

  const { isLoading: awesomePromptIsLoading, data } = useFetch<CSVPrompt[]>(
    "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv",
    {
      parseResponse: async (response) => {
        const text = await response.text();
        return parse(text, {
          columns: true,
        });
      },
      keepPreviousData: true,
    }
  );

  const setPrompt = (chosePrompt: string) => {
    if (chosePrompt !== "none") {
      setValue("prompt", chosePrompt);
    }
  };

  const [showAwesomePrompts, setShowAwesomePrompts] = useState(false);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" icon={Icon.SaveDocument} onSubmit={handleSubmit} />
          <Action
            title="Toggle Awesome Prompts"
            icon={{ source: "🧠" }}
            onAction={() => setShowAwesomePrompts((s) => !s)}
          />
        </ActionPanel>
      }
    >
      <Form.TextField title="Name" placeholder="Name your model" {...itemProps.name} />
      {showAwesomePrompts && (
        <Form.Dropdown
          id="template"
          title="Awesome Prompts"
          isLoading={awesomePromptIsLoading}
          defaultValue="none"
          onChange={setPrompt}
        >
          <Form.Dropdown.Item value="none" title="Choose an Awesome ChatGPT Prompts" icon={"🧠"} />
          {(data || []).map((prompt) => (
            <Form.Dropdown.Item value={prompt.prompt} title={prompt.act} key={prompt.prompt} />
          ))}
        </Form.Dropdown>
      )}
      <Form.TextArea title="Prompt" placeholder="Describe your prompt" {...itemProps.prompt} />
      <Form.TextField
        title="Temperature"
        placeholder="Set your sampling temperature (0 - 2)"
        {...itemProps.temperature}
      />
      {isCustomModel ? (
        <Form.TextField title="Model" placeholder="Custom model name" {...itemProps.option} />
      ) : (
        <Form.Dropdown title="Model" placeholder="Choose model option" {...itemProps.option}>
          {MODEL_OPTIONS.map((option) => (
            <Form.Dropdown.Item value={option} title={option} key={option} />
          ))}
        </Form.Dropdown>
      )}

      <Form.Checkbox title="Vision" label="Enable vision capabilities" {...itemProps.vision} />
      {model?.id !== "default" && <Form.Checkbox title="Pinned" label="Pin model" {...itemProps.pinned} />}
    </Form>
  );
};
