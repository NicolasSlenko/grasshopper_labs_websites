import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deleteFromS3, getJsonFromS3, putJsonToS3 } from "@/lib/aws/s3"
import { calculateResumeScore } from "@/lib/resumeScoring"
import type { Resume } from "@/app/api/parse/resumeSchema"

interface ResumeSubmission {
  id: string
  fileName: string
  s3Key: string
  uploadedAt: string
  score: number
}

interface SubmissionsMetadata {
  submissions: ResumeSubmission[]
}

// POST - Save resume data
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const resumeData = await request.json() as Resume

    // Calculate the score from parsed resume data
    const score = calculateResumeScore(resumeData)

    await putJsonToS3(`uploads/${userId}/resume-data.json`, resumeData)

    // Update the most recent submission's score with the calculated score
    const metadataKey = `uploads/${userId}/submissions-metadata.json`
    const metadata = await getJsonFromS3<SubmissionsMetadata>(metadataKey)
    
    if (metadata && metadata.submissions.length > 0) {
      // Update the most recent submission's score
      metadata.submissions[0].score = score
      await putJsonToS3(metadataKey, metadata)
    }

    return NextResponse.json({ 
      success: true, 
      message: "Resume data saved successfully",
      score 
    })
  } catch (error) {
    console.error("Error saving resume data:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to save resume data",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const resumeData = await getJsonFromS3<Resume>(`uploads/${userId}/resume-data.json`);

    if (!resumeData) {
      return NextResponse.json({
        success: false,
        data: null,
        message: "No resume data found"
      });
    }

    // Calculate score and breakdown using the same logic as frontend
    const { calculateResumeScore, getScoreBreakdown } = await import("@/lib/resumeScoring");
    const score = calculateResumeScore(resumeData);
    const breakdown = getScoreBreakdown(resumeData);

    return NextResponse.json({
      success: true,
      data: resumeData,
      score,
      breakdown
    });
  } catch (error) {
    console.error("Error loading resume data:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Failed to load resume data",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    // Also clear matched courses when resume is deleted (S3 cache)
    await deleteFromS3(`uploads/${userId}/matched-courses.json`)

    await deleteFromS3(`uploads/${userId}/resume-data.json`)

    return NextResponse.json({ 
      success: true, 
      message: "Resume data and matched courses cleared successfully" 
    })
  } catch (error) {
    console.error("Error clearing resume data:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to clear resume data",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
