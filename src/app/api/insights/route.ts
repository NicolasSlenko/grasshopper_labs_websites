import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getJsonFromS3, putJsonToS3 } from "@/lib/aws/s3"
import { userInsightsSchema, type UserInsights, type ActionableInsight } from "./insightsSchema"

const insightsKey = (userId: string) => `uploads/${userId}/insights.json`

// GET - Fetch user's saved insights
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 })
        }

        const data = await getJsonFromS3<UserInsights>(insightsKey(userId))

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error) {
        console.error("Error loading insights:", error)
        return NextResponse.json(
            {
                success: false,
                data: null,
                error: "Failed to load insights",
            },
            { status: 500 },
        )
    }
}

// POST - Save/update user's checked insights
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const payload = await request.json()

        // Validate the insights array
        const insights = userInsightsSchema.parse({
            insights: payload.insights,
            generatedAt: payload.generatedAt || new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
        })

        await putJsonToS3(insightsKey(userId), insights)

        return NextResponse.json({
            success: true,
            message: "Insights saved successfully",
        })
    } catch (error) {
        console.error("Error saving insights:", error)
        const status = error instanceof Error && "issues" in error ? 400 : 500

        return NextResponse.json(
            {
                success: false,
                error: status === 400 ? "Invalid insights payload" : "Failed to save insights",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status },
        )
    }
}

// PATCH - Update checked status for specific insights
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        const { insightIds, checked } = await request.json() as {
            insightIds: string[]
            checked: boolean
        }

        // Load existing insights
        const existingData = await getJsonFromS3<UserInsights>(insightsKey(userId))

        if (!existingData) {
            return NextResponse.json(
                { success: false, error: "No insights found to update" },
                { status: 404 }
            )
        }

        // Update the checked status
        const updatedInsights = existingData.insights.map(insight =>
            insightIds.includes(insight.id)
                ? { ...insight, checked }
                : insight
        )

        const updatedData: UserInsights = {
            ...existingData,
            insights: updatedInsights,
            lastUpdatedAt: new Date().toISOString(),
        }

        await putJsonToS3(insightsKey(userId), updatedData)

        return NextResponse.json({
            success: true,
            message: "Insights updated successfully",
        })
    } catch (error) {
        console.error("Error updating insights:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update insights",
            },
            { status: 500 },
        )
    }
}
