import { Tool } from "./index";
import { z } from "zod";

const schema = z.object({
  url: z.string().describe("the url of the website"),
});

type Infer = z.infer<typeof schema>;

export default class WebsiteTool implements Tool<Infer> {
  async execute(input: Infer) {
    console.log(input.url);
    const response = await fetch(`https://r.jina.ai/${input.url}`, {
      method: "GET",
    });
    return response.text();
  }

  define() {
    return {
      name: "website",
      description: "Fetch the content of a website by its url",
      schema,
    };
  }
}
