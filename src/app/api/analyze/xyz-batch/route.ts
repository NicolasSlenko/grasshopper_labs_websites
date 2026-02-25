import { OpenAI } from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getJsonFromS3, putJsonToS3 } from "@/lib/aws/s3";
import type { Resume } from "@/app/api/parse/resumeSchema";

// GET — serve cached XYZ feedback + insights
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await getJsonFromS3(`uploads/${userId}/xyz-feedback.json`);
        if (!data) {
            return NextResponse.json({ success: false, data: null });
        }
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, data: null });
    }
}

const FeedbackItemSchema = z.object({
    score: z.number().describe("Score from 0-100 based on usage of XYZ formula and quantitative metrics"),
    xyz_analysis: z.string().describe("Brief explanation of how well the description follows 'Accomplished [X] as measured by [Y], by doing [Z]'"),
    improvements: z.array(z.string()).describe("2-3 specific rewritten versions improving the description using the XYZ formula"),
});

const InsightSchema = z.object({
    id: z.string().describe("Unique ID like 'insight-1', 'insight-2', etc."),
    category: z.enum(["projects", "experience", "skills", "gpa", "coursework", "links"]),
    insight: z.string().describe("A specific, actionable recommendation"),
    priority: z.enum(["high", "low"]).describe("high = critical to fix, low = nice to have"),
});

const BatchResultSchema = z.object({
    projects: z.array(z.object({
        index: z.number(),
        feedback: FeedbackItemSchema,
    })).describe("XYZ analysis for each project, by index"),
    experience: z.array(z.object({
        index: z.number(),
        feedback: FeedbackItemSchema,
    })).describe("XYZ analysis for each experience entry, by index"),
    actionableInsights: z.array(InsightSchema).describe("8-15 actionable insights synthesized from the XYZ analysis and overall resume quality"),
});

const MODEL = "gpt-4.1-mini";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { resumeData } = await request.json() as { resumeData: Resume };

        if (!resumeData) {
            return NextResponse.json({ error: "No resume data provided" }, { status: 400 });
        }

        const client = new OpenAI();

        // Build a concise summary of all items to analyze
        const projectItems = (resumeData.projects || []).map((p, i) => {
            const text = [p.description, ...(p.highlights || [])].filter(Boolean).join("\n");
            return `PROJECT ${i}: "${p.name}"\n${text}`;
        });

        const experienceItems = (resumeData.experience || []).map((e, i) => {
            const text = [...(e.responsibilities || []), ...(e.achievements || [])].filter(Boolean).join("\n");
            return `EXPERIENCE ${i}: "${e.position}" at "${e.company}"\n${text}`;
        });

        // Build a resume overview for insights context
        const allSkills = resumeData.skills
            ? Object.values(resumeData.skills).flat().filter(Boolean)
            : [];
        const resumeOverview = [
            allSkills.length ? `Skills: ${allSkills.join(", ")}` : null,
            resumeData.education?.length ? `Education: ${resumeData.education.map(e => `${e.degree} in ${e.field} at ${e.school}${e.gpa ? ` (GPA: ${e.gpa})` : ""}`).join("; ")}` : null,
            resumeData.basics ? `Links: ${[resumeData.basics.linkedin, resumeData.basics.github, resumeData.basics.portfolio].filter(Boolean).join(", ")}` : null,
        ].filter(Boolean).join("\n");

        if (projectItems.length === 0 && experienceItems.length === 0) {
            const emptyResult = { projects: {}, experience: {}, actionableInsights: [] };
            await putJsonToS3(`uploads/${userId}/xyz-feedback.json`, emptyResult);
            return NextResponse.json({ success: true, data: emptyResult });
        }

        const prompt = `
Analyze this resume and provide two things:

1. XYZ Formula Analysis for each project and experience item:
   - Score (0-100) based on "Accomplished [X] as measured by [Y], by doing [Z]"
   - Brief analysis of adherence
   - 2-3 rewritten versions that improve it

2. Actionable Insights (8-15 total):
   Synthesize the XYZ analysis results with the overall resume to generate specific, actionable recommendations.
   Focus on what the person should actually DO to improve their resume. Be specific and reference their actual content.
   Use "high" priority for critical issues (missing metrics, weak bullet points, gaps) and "low" for nice-to-have improvements.

=== RESUME OVERVIEW ===
${resumeOverview}

${projectItems.length > 0 ? "=== PROJECTS ===\n" + projectItems.join("\n\n") : ""}

${experienceItems.length > 0 ? "=== EXPERIENCE ===\n" + experienceItems.join("\n\n") : ""}
`;

        const result = await client.responses.parse({
            model: MODEL,
            input: [
                { role: "system", content: "You are an expert resume consultant. Analyze each item for XYZ formula adherence, then synthesize findings into actionable insights. Be specific — reference actual content from the resume." },
                { role: "user", content: prompt }
            ],
            text: {
                format: zodTextFormat(BatchResultSchema, "batch_feedback")
            },
            temperature: 0.3,
        });

        const feedbackData = result.output_parsed;

        // Transform to index-keyed maps for easy lookup
        const indexed = {
            projects: Object.fromEntries(
                (feedbackData?.projects || []).map(p => [p.index, p.feedback])
            ),
            experience: Object.fromEntries(
                (feedbackData?.experience || []).map(e => [e.index, e.feedback])
            ),
            actionableInsights: (feedbackData?.actionableInsights || []).map(i => ({
                ...i,
                checked: false,
            })),
        };

        // Cache to S3
        await putJsonToS3(`uploads/${userId}/xyz-feedback.json`, indexed);

        return NextResponse.json({ success: true, data: indexed });

    } catch (error) {
        console.error("Error in batch XYZ analysis:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to generate batch analysis"
        }, { status: 500 });
    }
}
