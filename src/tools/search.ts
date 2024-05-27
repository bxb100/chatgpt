import { Tool } from "./index";
import { z } from "zod";

const schema = z.object({
  keywords: z.string().describe("the keywords used for search engine to search the web"),
});

type Infer = z.infer<typeof schema>;

export default class SearchTool implements Tool<Infer> {
  async execute(input: Infer) {
    console.log(input.keywords);
    const response = await fetch(`https://s.jina.ai/${input.keywords}`, {
      method: "GET",
    });
    const res = await response.text();
    console.log(res);
    return res;
  }

  define() {
    return {
      name: "search",
      description: "Useful for search the web to retrive real-time and accurate information",
      schema,
    };
  }
}
