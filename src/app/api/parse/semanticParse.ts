import { OpenAI } from "openai";
import ResumeSchema from "./resumeSchema";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod.mjs";

const ResultSchema = z.object({
  details: ResumeSchema,
  missing: z.array(z.string())
})

const modelPricing = {
  "gpt-4.1-mini": { input: .4, output: 1.6 },
  "gpt-5-nano": { input: .05, output: .4 },
  "gpt-5-mini": { input: .25, output: 2.0 }
}
const MODEL = "gpt-4.1-mini"


const SYSTEM_PROMPT = `
You are a resume helper who creates structured JSON. 
Return:
{
  "details": {},   // must match provided schema
  "missing": []    // required basics/education fields that are absent
}
`

export const extractWithChatGPT = async (content: string) => {
  try {
    const client = new OpenAI()
    const result = await client.responses.parse({
      model: MODEL,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Extract the following resume: ${content}` },
      ],
      text: {
        format: zodTextFormat(ResultSchema, "results")
      },
      temperature: 0,
    })

    if (result.usage) {
      const { input_tokens, output_tokens, total_tokens } = result.usage

      console.log(`Total tokens generated: ${total_tokens}`)

      const inputCost = (input_tokens / 1_000_000) * modelPricing[MODEL]["input"]
      const outputCost = (output_tokens / 1_000_000) * modelPricing[MODEL]["output"]
      const price = inputCost + outputCost

      console.log(`Input tokens: ${input_tokens}, Output tokens: ${output_tokens}`)
      console.log(`Total price of API call: $${price.toFixed(6)}`)
    }

    return result.output_parsed
  } catch (e) {
    console.log(e)
    return { details: null, missing: [] }
  }
}