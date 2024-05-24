import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import React, { useEffect, useState } from "react";
import { IAction } from "../constants/initialActions";
import { DEFAULT_MODEL, useModel } from "../hooks/useModel";
import { Model } from "../type";
import { useForm } from "@raycast/utils";

interface AddActionFormProps {
  addAction?: (action: IAction) => Promise<void>;
  updateAction?: (action: IAction) => Promise<void>;
  action?: IAction;
}

export default function MergeActionForm({ addAction, updateAction, action }: AddActionFormProps) {
  const { pop } = useNavigation();

  const { itemProps, handleSubmit } = useForm<IAction>({
    onSubmit: async (value) => {
      value.id = action?.id || Date.now().toString();
      value.default = action?.default || false;
      if (updateAction) {
        await updateAction(value);
        await showToast(Toast.Style.Success, "Action updated!");
      } else if (addAction) {
        await addAction(value);
        await showToast(Toast.Style.Success, "Action saved!");
      } else {
        throw new Error("No action handler found");
      }
      pop();
    },
    validation: {
      prompt: (value) => {
        // simply check
        if (value && !value.includes("{{")) {
          return "Need set dynamic tag";
        } else if (!value) {
          return "Prompt is required";
        }
      },
    },
    initialValues: {
      title: action?.title || "",
      description: action?.description || "",
      prompt: action?.prompt || "",
      icon: action?.icon || "Paragraph",
      modelId: action?.modelId || "default",
      default: action?.default || false,
    },
  });

  const { data, isLoading } = useModel();

  const [defaultModel, setDefaultModel] = useState<Model | null>(null);
  const [separateDefaultModel, setSeparateDefaultModel] = useState<Model[] | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    setSeparateDefaultModel(data.filter((x) => x.id !== "default"));
    setDefaultModel(data.find((x) => x.id === "default") ?? DEFAULT_MODEL);
  }, [isLoading]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Action" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField title="Title" placeholder="Enter title" {...itemProps.title} />
      <Form.TextField title="Description" placeholder="Enter description" {...itemProps.description} />
      <Form.Dropdown title="Icon" {...itemProps.icon}>
        {Object.keys(Icon).map((key) => (
          <Form.Dropdown.Item key={key} value={key} title={key} icon={Icon[key as keyof typeof Icon]} />
        ))}
      </Form.Dropdown>
      <Form.TextArea title="Prompt" placeholder="Enter prompt" {...itemProps.prompt} />
      {
        // the value not match any values warning so annoying
        (defaultModel || separateDefaultModel) && (
          <Form.Dropdown title="Model" placeholder="Choose model" {...itemProps.modelId}>
            {defaultModel && (
              <Form.Dropdown.Item key={defaultModel.id} title={defaultModel.name} value={defaultModel.id} />
            )}
            <Form.Dropdown.Section title="Custom Models">
              {separateDefaultModel &&
                separateDefaultModel.map((model) => (
                  <Form.Dropdown.Item value={model.id} title={model.name} key={model.id} />
                ))}
            </Form.Dropdown.Section>
          </Form.Dropdown>
        )
      }
    </Form>
  );
}
