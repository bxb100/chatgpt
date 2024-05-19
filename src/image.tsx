import { useChatGPT } from "./hooks/useChatGPT";
import { useEffect, useState } from "react";
import { Action, ActionPanel, Form, Grid, Icon, useNavigation } from "@raycast/api";
import { showFailureToast, useForm } from "@raycast/utils";
import { ImageGenerateParams } from "openai/src/resources/images";
import { GenerateImageParams } from "./type";

export default function Image() {
  const openai = useChatGPT();
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<{ prompt: string; model: string; images: string[] }[]>([]);
  const [generateBody, setGenerateBody] = useState<GenerateImageParams>({
    model: "dall-e-3",
    n: "1",
    prompt: "",
    size: "1024x1024",
    style: undefined,
  });
  const [firstEnter, setFirstEnter] = useState(true);
  const [formSubmit, setFormSubmit] = useState(false);

  useEffect(() => {
    if (firstEnter || !formSubmit) {
      return;
    }
    setIsLoading(true);
    (async function fetchImage() {
      try {
        const response = await openai.images.generate({
          prompt: generateBody.prompt,
          model: generateBody.model,
          n: Number(generateBody.n),
          size: generateBody.size as ImageGenerateParams["size"],
          style: generateBody.model == "dall-e-3" ? (generateBody.style as ImageGenerateParams["style"]) : undefined,
        });

        setSections((prev) => [
          {
            prompt: generateBody.prompt,
            model: generateBody.model,
            images: response.data.map((d) => d.url).filter(Boolean) as string[],
          },
          ...prev,
        ]);
      } catch (error) {
        await showFailureToast(error);
      }
      setIsLoading(false);
    })();
  }, [firstEnter, formSubmit]);

  const { pop } = useNavigation();

  return firstEnter ? (
    <Forms
      body={generateBody}
      onSubmit={(v) => {
        setGenerateBody(v);
        setFirstEnter(false);
        setFormSubmit(true);
      }}
    />
  ) : (
    <Grid
      isLoading={isLoading}
      columns={5}
      fit={Grid.Fit.Fill}
      inset={Grid.Inset.Zero}
      actions={
        <ActionPanel>
          <Action.Push
            onPush={() => setFormSubmit(false)}
            target={
              <Forms
                body={generateBody}
                onSubmit={(v) => {
                  setGenerateBody(v);
                  setFormSubmit(true);
                  pop();
                }}
              />
            }
            title="Generate"
            icon={Icon.Checkmark}
          />
        </ActionPanel>
      }
    >
      {sections.map((section) => (
        <Grid.Section title={"DALL-E " + (section.model === "dall-e-3" ? 3 : 2) + ": " + section.prompt}>
          {section.images.map((image) => (
            <Grid.Item
              key={image}
              content={image}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title={"Copy URL"} content={image} />
                  <Action.Push
                    onPush={() => setFormSubmit(false)}
                    target={
                      <Forms
                        body={generateBody}
                        onSubmit={(v) => {
                          setGenerateBody(v);
                          setFormSubmit(true);
                          pop();
                        }}
                      />
                    }
                    title="Generate"
                    icon={Icon.Checkmark}
                  />
                </ActionPanel>
              }
            />
          ))}
        </Grid.Section>
      ))}
    </Grid>
  );
}

const Forms = ({ body, onSubmit }: { body: GenerateImageParams; onSubmit: (body: GenerateImageParams) => void }) => {
  const { itemProps, handleSubmit, values } = useForm<GenerateImageParams>({
    onSubmit: onSubmit,
    initialValues: body,
    validation: {
      prompt: (value) => (value && value.length > 0 ? undefined : "Prompt is required"),
      n: (value) => {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return "Must be a number";
        } else if (values.model === "dall-e-3" && numValue !== 1) {
          return "For DALL-E 3, only n=1 is supported";
        } else if (numValue < 1 || numValue > 10) {
          return "Must be between 1 and 10";
        }
      },
    },
  });
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm icon={Icon.Checkmark} title="Generate" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField title="Prompt" {...itemProps.prompt} placeholder="a white siamese cat" />
      <Form.Dropdown title="Model" {...itemProps.model}>
        <Form.Dropdown.Item value="dall-e-2" title="DALL-E 2" />
        <Form.Dropdown.Item value="dall-e-3" title="DALL-E 3" />
      </Form.Dropdown>
      <Form.Dropdown title={"Size"} {...itemProps.size}>
        {/*https://platform.openai.com/docs/api-reference/images*/}
        {values.model === "dall-e-2" ? (
          <>
            <Form.Dropdown.Item value="256x256" title="256x256" />
            <Form.Dropdown.Item value="512x512" title="512x512" />
            <Form.Dropdown.Item value="1024x1024" title="1024x1024" />
          </>
        ) : (
          <>
            <Form.Dropdown.Item value="1024x1024" title="1024x1024" />
            <Form.Dropdown.Item value="1024x1792" title="1024x1792" />
            <Form.Dropdown.Item value="1792x1024" title="1792x1024" />
          </>
        )}
      </Form.Dropdown>
      <Form.TextField title="Number of Images" {...itemProps.n} />

      {values.model == "dall-e-3" && (
        <Form.Dropdown title={"style"} {...itemProps.style}>
          <Form.Dropdown.Item value="vivid" title="Vivid" />
          <Form.Dropdown.Item value="natural" title="Natural" />
        </Form.Dropdown>
      )}
    </Form>
  );
};
