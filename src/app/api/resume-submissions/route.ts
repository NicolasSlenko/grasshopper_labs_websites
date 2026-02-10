import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { listObjectsInS3, getJsonFromS3, putJsonToS3, deleteFromS3 } from "@/lib/aws/s3"
import { calculateResumeScore } from "@/lib/resumeScoring"
import type { Resume } from "@/app/api/parse/resumeSchema"

export interface ResumeSubmission {
  id: string
  fileName: string
  s3Key: string
  uploadedAt: string
  score: number
}

interface SubmissionsMetadata {
  submissions: ResumeSubmission[]
}

// GET - Fetch all resume submissions for the current user
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Always get the current resume data for accurate score calculation
    const resumeData = await getJsonFromS3<Resume>(`uploads/${userId}/resume-data.json`)
    const calculatedScore = resumeData ? calculateResumeScore(resumeData) : 0

    // Try to get existing submissions metadata
    const metadataKey = `uploads/${userId}/submissions-metadata.json`
    let metadata = await getJsonFromS3<SubmissionsMetadata>(metadataKey)

    if (!metadata) {
      // If no metadata exists, scan the resumes folder and create metadata
      const resumesPrefix = `uploads/${userId}/resumes/`
      const objects = await listObjectsInS3(resumesPrefix)

      const submissions: ResumeSubmission[] = objects
        .filter((obj) => obj.key !== resumesPrefix) // Filter out the folder itself
        .map((obj) => {
          const fileName = obj.key.split("/").pop() || "unknown"
          return {
            id: Buffer.from(obj.key).toString("base64"),
            fileName,
            s3Key: obj.key,
            uploadedAt: obj.lastModified?.toISOString() || new Date().toISOString(),
            // Use calculated score from resume data, or 0 if not parsed yet
            score: calculatedScore,
          }
        })
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

      // Save the metadata for future use
      if (submissions.length > 0) {
        await putJsonToS3(metadataKey, { submissions })
      }

      return NextResponse.json({
        success: true,
        data: submissions,
      })
    }

    // Only update the most recent submission's score with the calculated score
    // Preserve existing scores for older submissions
    const updatedSubmissions = metadata.submissions.map((submission, index) => {
      if (index === 0 && calculatedScore > 0) {
        // Most recent submission (index 0) gets the current calculated score
        return { ...submission, score: calculatedScore }
      }
      // Keep existing scores for older submissions
      return submission
    })

    // Always update the cached metadata with the current score for most recent
    await putJsonToS3(metadataKey, { submissions: updatedSubmissions })

    return NextResponse.json({
      success: true,
      data: updatedSubmissions,
    })
  } catch (error) {
    console.error("Error fetching resume submissions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch resume submissions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// POST - Add a new submission to the metadata (called after upload)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { fileName, s3Key } = await request.json()

    if (!fileName || !s3Key) {
      return NextResponse.json(
        { success: false, error: "Missing fileName or s3Key" },
        { status: 400 }
      )
    }

    const metadataKey = `uploads/${userId}/submissions-metadata.json`
    let metadata = await getJsonFromS3<SubmissionsMetadata>(metadataKey)

    // Try to get saved resume data for score calculation
    const resumeData = await getJsonFromS3<Resume>(`uploads/${userId}/resume-data.json`)
    const calculatedScore = resumeData ? calculateResumeScore(resumeData) : 0

    const newSubmission: ResumeSubmission = {
      id: Buffer.from(s3Key + Date.now()).toString("base64"),
      fileName,
      s3Key,
      uploadedAt: new Date().toISOString(),
      // Use calculated score from resume data, or 0 if not parsed yet
      score: calculatedScore,
    }

    if (!metadata) {
      metadata = { submissions: [] }
    }

    metadata.submissions.unshift(newSubmission) // Add to beginning (most recent first)

    await putJsonToS3(metadataKey, metadata)

    return NextResponse.json({
      success: true,
      data: newSubmission,
    })
  } catch (error) {
    console.error("Error adding resume submission:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add resume submission",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// DELETE - Clear all resume submissions
export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Delete the submissions metadata file
    const metadataKey = `uploads/${userId}/submissions-metadata.json`
    await deleteFromS3(metadataKey)

    // Delete all resume files from the resumes folder
    const resumesPrefix = `uploads/${userId}/resumes/`
    const objects = await listObjectsInS3(resumesPrefix)

    for (const obj of objects) {
      if (obj.key !== resumesPrefix) {
        await deleteFromS3(obj.key)
      }
    }

    return NextResponse.json({
      success: true,
      message: "All submissions cleared",
    })
  } catch (error) {
    console.error("Error clearing resume submissions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear resume submissions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
