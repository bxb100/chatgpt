import { Icon } from "@raycast/api";

export type IAction = {
  id: string;
  title: string;
  modelId: string;
  description: string;
  icon: keyof typeof Icon | string;
  prompt: string;
  default: boolean;
  showDiff?: boolean;
};

const systemPrompt =
  "Act as an application. You should only output the result of the prompt. Do not include any additional information.";

const initialActions: IAction[] = [
  {
    id: "1",
    title: "Summarize",
    modelId: "default",
    description: "Summarize the text",
    icon: "Paragraph",
    prompt: `${systemPrompt} Summarize the text in 1-2 sentences. {{select}}`,
    default: true,
  },
  {
    id: "2",
    title: "Translate",
    modelId: "default",
    description: "Translate the text",
    icon: "Globe",
    prompt: `Only reply the translated result and nothing else. Please translate to Chinese:\n\n{{select}}`,
    default: false,
  },
  {
    id: "3",
    title: "Add Typescript to JS",
    modelId: "default",
    description: "Add Typescript to the JS file",
    icon: "Code",
    prompt: `${systemPrompt} Add Typescript to the following JS file.  {{select}}`,
    default: false,
  },
  {
    id: "4",
    title: "Correct Punctuation & Grammar",
    modelId: "default",
    description: "Correct the punctuation and grammar",
    icon: "Pencil",
    prompt: `${systemPrompt} Correct the punctuation and grammar in the following text. {{select}}`,
    default: false,
  },
  {
    id: "5",
    title: "Generate Inline Documentation",
    modelId: "default",
    description: "Generate documentation for the code",
    icon: "Book",
    prompt: `${systemPrompt} Generate production-ready documentation to be placed above the following code. {{select}}`,
    default: false,
  },
  {
    id: "6",
    title: "Code Review",
    modelId: "default",
    description: "Review the code",
    icon: "EyeDropper",
    prompt: `${systemPrompt} Review the following code and provide feedback. {{select}}`,
    default: false,
  },
  {
    id: "7",
    title: "Generate Tests",
    modelId: "default",
    description: "Generate tests for the code",
    icon: "Checkmark",
    prompt: `${systemPrompt} Generate tests for the following code. {{select}}`,
    default: false,
  },
  {
    id: "8",
    title: "Generate Email",
    modelId: "default",
    description: "Generate a formal email",
    icon: "Envelope",
    prompt: `${systemPrompt} Generate a formal email based on the following text. {{clipboard}}`,
    default: false,
  },
  {
    id: "9",
    title: "Summarize Website",
    modelId: "default",
    description: "Summarize the website using raycast extension",
    icon: "MagnifyingGlass",
    prompt: `${systemPrompt} Summarize the text below and give me a list of bullet points with key insights and the most important facts.{{content}}`,
    default: false,
  },
  // https://prompts.ray.so/raycast
  {
    id: "10",
    title: "Fix Spelling and Grammar",
    modelId: "default",
    description: "Fix Spelling and Grammar",
    icon: "RaycastLogoNeg",
    prompt: `Act as a spelling corrector and improver. Reply to each message only with the rewritten text
    
Strictly follow these rules:
- Correct spelling, grammar and punctuation
- ALWAYS detect and maintain the original language of the text
- NEVER surround the rewritten text with quotes
- Don't replace urls with markdown links
- Don't change emojis

Text: {{select}}

Fixed Text:`,
    default: false,
    showDiff: true,
  },
];

export default initialActions;
