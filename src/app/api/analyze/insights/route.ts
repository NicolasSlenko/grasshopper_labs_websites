import { OpenAI } from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const InsightItemSchema = z.object({
    id: z.string().describe("Unique identifier like 'gen_1' or 'pref_1'"),
    title: z.string().describe("Short actionable title"),
    description: z.string().describe("Detailed explanation of the recommendation"),
    priority: z.enum(["high", "medium", "low"]),
    category: z.enum(["projects", "experience", "skills", "links", "gpa", "coursework", "formatting"]),
});

const InsightsResultSchema = z.object({
    general: z.array(InsightItemSchema).describe("General resume improvement recommendations applicable to any resume"),
    preferenceSpecific: z.array(InsightItemSchema.extend({
        targetRole: z.string().describe("The specific role or sector this recommendation targets"),
    })).describe("Recommendations tailored to the user's target roles and sectors"),
});

const MODEL = "gpt-4.1-mini";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { resumeData, preferences } = await request.json();

        if (!resumeData) {
            return NextResponse.json({ error: "No resume data provided" }, { status: 400 });
        }

        const client = new OpenAI();

        const preferencesContext = preferences
            ? `
The user has specified the following job preferences from their survey:
- Target Role Types: ${preferences.roleTypes?.join(", ") || "Not specified"}
- Target Tech Sectors: ${preferences.techSectors?.join(", ") || "Not specified"}

Use these preferences to generate highly specific, actionable recommendations in the "preferenceSpecific" section.
`
            : "The user has not specified job preferences. Leave the preferenceSpecific array empty.";

        const prompt = `
Analyze the following resume JSON and generate actionable improvement recommendations.

${preferencesContext}

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Generate recommendations in two groups:
1. "general" — Universal resume best practices (e.g., add more metrics, improve bullet point structure, missing sections, formatting suggestions). Generate 4-8 items.
2. "preferenceSpecific" — Recommendations specifically tailored to the user's target roles/sectors (e.g., specific technologies to add for a Frontend Developer role, types of projects to highlight for a Data Science role). Generate 3-6 items if preferences exist, otherwise leave empty.

Be specific and actionable. Reference actual items from their resume when possible.
`;

        const result = await client.responses.parse({
            model: MODEL,
            input: [
                { role: "system", content: "You are an expert career advisor and resume consultant. Provide specific, actionable insights based on the resume data and the user's career goals." },
                { role: "user", content: prompt }
            ],
            text: {
                format: zodTextFormat(InsightsResultSchema, "insights")
            },
            temperature: 0.4,
        });

        return NextResponse.json({ success: true, data: result.output_parsed });

    } catch (error) {
        console.error("Error generating insights:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to generate insights"
        }, { status: 500 });
    }
}
