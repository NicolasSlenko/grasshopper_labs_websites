import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deleteFromS3, getJsonFromS3, putJsonToS3 } from "@/lib/aws/s3"

// POST - Save resume data
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const resumeData = await request.json()

    await putJsonToS3(`uploads/${userId}/resume-data.json`, resumeData)

    return NextResponse.json({ 
      success: true, 
      message: "Resume data saved successfully" 
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
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 })
    }

    const resumeData = await getJsonFromS3<Record<string, unknown>>(`uploads/${userId}/resume-data.json`)

    if (!resumeData) {
      return NextResponse.json({ 
        success: false, 
        data: null,
        message: "No resume data found" 
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: resumeData 
    })
  } catch (error) {
    console.error("Error loading resume data:", error)
    return NextResponse.json(
      { 
        success: false, 
        data: null,
        error: "Failed to load resume data",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
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
