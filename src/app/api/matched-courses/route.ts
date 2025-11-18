import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deleteFromS3, getJsonFromS3, putJsonToS3 } from "@/lib/aws/s3"

// GET - Retrieve cached matched courses
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const matchedCoursesData = await getJsonFromS3<Record<string, unknown>>(`uploads/${userId}/matched-courses.json`)
    if (!matchedCoursesData) {
      return NextResponse.json({
        success: false,
        error: "No matched courses found",
        message: "Please upload and verify your resume first. Course matching will happen automatically."
      }, { status: 404 })
    }

    return NextResponse.json(matchedCoursesData)
  } catch (error) {
    console.error("Error reading matched courses:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to read matched courses",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// DELETE - Clear cached matched courses
export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    await deleteFromS3(`uploads/${userId}/matched-courses.json`)
    
    return NextResponse.json({ 
      success: true,
      message: "Matched courses cleared"
    })
  } catch (error) {
    console.error("Error deleting matched courses:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete matched courses",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
