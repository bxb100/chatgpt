import { Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { FormValidation, useFetch, useForm } from "@raycast/utils";
import { v4 as uuidv4 } from "uuid";
import { CSVPrompt, Model, ModelHook } from "../../type";
import { parse } from "csv-parse/sync";
import { useState } from "react";
import { getConfiguration } from "../../hooks/useChatGPT";
import { DEFAULT_MODEL } from "../../hooks/useModel";
import { supportTools } from "../../tools";

export const ModelForm = (props: { model?: Model; use: { models: ModelHook }; name?: string }) => {
  const { use, model } = props;
  const { pop } = useNavigation();
  const { isCustomModel } = getConfiguration();

  const { handleSubmit, itemProps, setValue, values } = useForm<Model>({
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
      enableFunctions: model?.enableFunctions ?? [],
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
          relax_quotes: true,
          skip_records_with_error: true,
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

  const [advanceAction, setAdvanceAction] = useState({
    prompts: false,
    functions: values.enableFunctions?.length ?? 0 > 0,
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" icon="icons/tabler/check.svg" onSubmit={handleSubmit} />
          <Action
            title="Toggle Prompts"
            icon="icons/tabler/file-text-ai.svg"
            onAction={() => setAdvanceAction((s) => ({ ...s, prompts: !s.prompts }))}
            shortcut={{
              modifiers: ["cmd", "shift"],
              key: "p",
            }}
          />
          {supportTools.length > 0 && (
            <Action
              title={"Toggle Functions"}
              icon="icons/tabler/function.svg"
              onAction={() => setAdvanceAction((s) => ({ ...s, functions: !s.functions }))}
              shortcut={{
                modifiers: ["cmd", "shift"],
                key: "f",
              }}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.TextField title="Name" placeholder="Name your model" {...itemProps.name} />
      {advanceAction.prompts && (
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
      {model?.id !== "default" && <Form.Checkbox title="Pin" label="Pin model" {...itemProps.pinned} />}

      <Form.Checkbox
        title="Vision"
        label="Enable upload images"
        info={"Enable meaning the models can take in images and answer questions about them"}
        {...itemProps.vision}
      />

      {advanceAction.functions && supportTools.length > 0 && (
        <Form.TagPicker title="Functions" {...itemProps.enableFunctions}>
          {supportTools.map((tool) => (
            <Form.TagPicker.Item key={tool.define().name} title={tool.define().name} value={tool.define().name} />
          ))}
        </Form.TagPicker>
      )}
    </Form>
  );
};
