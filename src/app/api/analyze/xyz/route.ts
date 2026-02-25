import { OpenAI } from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const FeedbackSchema = z.object({
    score: z.number().describe("Score from 0-100 based on usage of XYZ formula and quantitative metrics"),
    xyz_analysis: z.string().describe("Explanation of how well the description follows 'Accomplished [X] as measured by [Y], by doing [Z]'"),
    improvements: z.array(z.string()).describe("Specific, rewritten examples or bullet points improving the description using the XYZ formula"),
});

const MODEL = "gpt-4.1-mini"; // Use consistent model identifier

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text, type } = await request.json();

        if (!text) {
            return NextResponse.json({ text: "No text provided", score: 0, xyz_analysis: "N/A", improvements: [] });
        }

        const client = new OpenAI();

        const prompt = `
      Analyze the following ${type} description for a resume.
      Criteria:
      1. Does it use the XYZ Formula? ("Accomplished [X] as measured by [Y], by doing [Z]")
      2. Does it include specific metrics (numbers, percentages)?
      3. Is it active and impactful?

      Description: "${text}"

      Provide a score (0-100), an analysis of its adherence to the XYZ formula, and 2-3 specific rewritten versions that improve it.
    `;

        const result = await client.responses.parse({
            model: MODEL,
            input: [
                { role: "system", content: "You are an expert resume consultant focusing on Google's XYZ formula." },
                { role: "user", content: prompt }
            ],
            text: {
                format: zodTextFormat(FeedbackSchema, "feedback")
            },
            temperature: 0.3,
        });

        return NextResponse.json({ success: true, data: result.output_parsed });

    } catch (error) {
        console.error("Error generating feedback:", error);
        // Return a default feedback structure instead of 500 to keep UI responsive
        return NextResponse.json({
            success: false,
            data: {
                score: 0,
                xyz_analysis: "Service unavailable.",
                improvements: ["Analysis failed due to server error."]
            }
        });
    }
}
