import { buildOpenAI } from "./hooks/useChatGPT";
import { useEffect, useState } from "react";
import {
  Action,
  ActionPanel,
  Detail,
  Form,
  getPreferenceValues,
  Grid,
  Icon,
  Keyboard,
  useNavigation,
} from "@raycast/api";
import { showFailureToast, useForm } from "@raycast/utils";
import { GenerateImage, GenerateImageParams, OpenAIImageGenerateParams, StoredImage } from "./type";
import OpenAI from "openai";
import fetch from "cross-fetch";
import { getConfigUrl, isSquare } from "./utils";
import { useLocalStorage } from "@raycast/utils/dist/useLocalStorage";

export default function Image() {
  const [openai] = useState(() => {
    const preferences = getPreferenceValues<Preferences.Image>();
    if (preferences.usingDifferentProvider) {
      return buildOpenAI(preferences.otherProviderToken!, preferences.otherProviderEndpoint);
    } else {
      return buildOpenAI(preferences.apiKey, getConfigUrl(preferences));
    }
  });

  const {
    isLoading: isLoadingSections,
    setValue: setSections,
    value: sections,
    removeValue,
  } = useLocalStorage<StoredImage[]>("image");

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
          size: generateBody.size as OpenAIImageGenerateParams["size"],
          style:
            generateBody.model == "dall-e-3" ? (generateBody.style as OpenAIImageGenerateParams["style"]) : undefined,
        });

        await setSections([
          {
            prompt: generateBody.prompt,
            model: generateBody.model,
            size: generateBody.size,
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
            shortcut={Keyboard.Shortcut.Common.New}
          />
          <Action
            title="Clear Cache"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={removeValue}
            shortcut={Keyboard.Shortcut.Common.RemoveAll}
          />
        </ActionPanel>
      }
    >
      {(sections || []).map((section, index) => (
        <Grid.Section
          key={index}
          title={
            `${section.model}: ${section.prompt}`.slice(0, 100) +
            (section.model.length + section.prompt.length > 98 ? "..." : "")
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
                    icon={Icon.Bird}
                    target={
                      <Detail
                        actions={
                          <ActionPanel>
                            <Action.OpenInBrowser title={"Open in Browser"} url={image.url} />
                            <Action.CopyToClipboard content={section.model} title={"Copy Model"} />
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
                            <Detail.Metadata.Label title="Prompt" text={section.prompt} />
                            <Detail.Metadata.Label title="Size" text={section.size} />
                            <Detail.Metadata.Label title={"Generate Date"} text={section.date.toLocaleString()} />
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
                  {isSquare(section.size) && (
                    <Action
                      title={"Create Five Variation"}
                      onAction={async () => {
                        setIsLoading(true);
                        try {
                          const item = await createVariation(openai, section.prompt, image.url);
                          await setSections([item, ...(sections || [])]);
                        } catch (e) {
                          await showFailureToast(e);
                        }
                        setIsLoading(false);
                      }}
                      icon={Icon.ComputerChip}
                    />
                  )}
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
                    shortcut={Keyboard.Shortcut.Common.New}
                  />
                  <Action
                    title="Clear Cache"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    onAction={removeValue}
                    shortcut={Keyboard.Shortcut.Common.RemoveAll}
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
  const { itemProps, handleSubmit, values, setValue } = useForm<GenerateImageParams>({
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
      <Form.TextArea title="Prompt" {...itemProps.prompt} placeholder="a white siamese cat" />
      {/*<Form.Dropdown title="Model" {...itemProps.model}>*/}
      {/*  <Form.Dropdown.Item value="dall-e-2" title="DALL-E 2" />*/}
      {/*  <Form.Dropdown.Item value="dall-e-3" title="DALL-E 3" />*/}
      {/*</Form.Dropdown>*/}
      <Form.TextField
        title="Model"
        id="model"
        onChange={(v) => setValue("model", v)}
        defaultValue="dall-e-3"
        storeValue={true}
      />
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

async function createVariation(openai: OpenAI, originalPrompt: string, url: string): Promise<StoredImage> {
  const res = await fetch(url);
  console.log(res.ok, res.status, res.statusText, res.headers.get("content-type"));
  const response = await openai.images.createVariation({
    // currently only support dall-e-2
    // https://platform.openai.com/docs/api-reference/images/createVariation
    model: "dall-e-2",
    size: "256x256",
    n: 5,
    image: res,
  });

  return {
    prompt: `[variation] ${originalPrompt}`,
    model: "dall-e-2",
    size: "256x256",
    date: new Date(),
    images: response.data.filter((x) => Boolean(x.url)) as GenerateImage[],
  };
}
