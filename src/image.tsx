import { buildOpenAI, useChatGPT } from "./hooks/useChatGPT";
import { useEffect, useState } from "react";
import { Action, ActionPanel, Detail, Form, getPreferenceValues, Grid, Icon, useNavigation } from "@raycast/api";
import { showFailureToast, useForm } from "@raycast/utils";
import { ImageGenerateParams } from "openai/src/resources/images";
import { GenerateImage, GenerateImageParams } from "./type";
import { useLocalStorage } from "@raycast/utils/dist/useLocalStorage";
import OpenAI from "openai";

export default function Image() {
  let openai: OpenAI;
  const references = getPreferenceValues<Preferences.Image>();
  if (references.usingDifferentProvider) {
    openai = buildOpenAI(references.otherProviderToken!, references.otherProviderEndpoint);
  } else {
    openai = useChatGPT();
  }

  const {
    isLoading: isLoadingSections,
    setValue: setSections,
    value: sections,
    removeValue,
  } = useLocalStorage<{ prompt: string; date: Date; model: string; images: GenerateImage[] }[]>("image");

  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(false);
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

        await setSections([
          {
            prompt: generateBody.prompt,
            model: generateBody.model,
            date: new Date(),
            images: response.data.filter((x) => Boolean(x.url)) as GenerateImage[],
          },
          ...(sections || []),
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
      setFirstEnter={setFirstEnter}
    />
  ) : (
    <Grid
      isLoading={isLoading || isLoadingSections}
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
            icon={Icon.AppWindowList}
          />
          <Action title="Clear Cache" icon={Icon.Trash} style={Action.Style.Destructive} onAction={removeValue} />
        </ActionPanel>
      }
    >
      {(sections || []).map((section, index) => (
        <Grid.Section
          key={index}
          title={
            "DALL-E " +
            (section.model === "dall-e-3" ? 3 : 2) +
            ": " +
            section.prompt.slice(0, 100) +
            (section.prompt.length > 100 ? "..." : "")
          }
          subtitle={section.date.toLocaleString()}
        >
          {section.images.map((image) => (
            <Grid.Item
              key={image.url}
              content={image.url}
              title={image.revised_prompt}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="Detail"
                    target={
                      <Detail
                        actions={
                          <ActionPanel>
                            <Action.OpenInBrowser title={"Open in Browser"} url={image.url} />
                            <Action.CopyToClipboard content={section.prompt} title={"Copy Prompt"} />
                            {image.revised_prompt && (
                              <Action.CopyToClipboard content={image.revised_prompt} title={"Copy Revised Prompt"} />
                            )}
                          </ActionPanel>
                        }
                        markdown={`![${image.revised_prompt}](${image.url})`}
                        metadata={
                          <Detail.Metadata>
                            <Detail.Metadata.Label title="Model" text={section.model} />
                            <Detail.Metadata.Label title={"Generate Date"} text={section.date.toLocaleString()} />
                            <Detail.Metadata.Label title="Prompt" text={section.prompt} />
                            {image.revised_prompt && (
                              <Detail.Metadata.Label title="Revised Prompt" text={image.revised_prompt} />
                            )}
                            <Detail.Metadata.Link title="Image URL" text="Open" target={image.url} />
                          </Detail.Metadata>
                        }
                      />
                    }
                  />
                  <Action.OpenInBrowser title={"Open in Browser"} url={image.url} />
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
                    icon={Icon.AppWindowList}
                  />
                  <Action
                    title="Clear Cache"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    onAction={removeValue}
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

const Forms = ({
  body,
  onSubmit,
  setFirstEnter,
}: {
  body: GenerateImageParams;
  onSubmit: (body: GenerateImageParams) => void;
  setFirstEnter?: (v: boolean) => void;
}) => {
  const { pop } = useNavigation();
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
        return undefined;
      },
    },
  });
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm icon={Icon.Checkmark} title="Generate" onSubmit={handleSubmit} />
          <Action
            title={"Show Grid"}
            icon={Icon.AppWindowGrid2x2}
            onAction={() => {
              if (setFirstEnter) {
                setFirstEnter(false);
              } else {
                pop();
              }
            }}
          />
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
        {values.model === "dall-e-3" ? (
          <>
            <Form.Dropdown.Item value="1024x1024" title="1024x1024" />
            <Form.Dropdown.Item value="1024x1792" title="1024x1792" />
            <Form.Dropdown.Item value="1792x1024" title="1792x1024" />
          </>
        ) : (
          <>
            <Form.Dropdown.Item value="256x256" title="256x256" />
            <Form.Dropdown.Item value="512x512" title="512x512" />
            <Form.Dropdown.Item value="1024x1024" title="1024x1024" />
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
