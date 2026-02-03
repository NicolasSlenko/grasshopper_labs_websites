import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSignedUrlForObject } from "@/lib/aws/s3"

// GET - Get a signed URL for viewing a resume
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const s3Key = searchParams.get("key")

    if (!s3Key) {
      return NextResponse.json(
        { success: false, error: "Missing s3Key parameter" },
        { status: 400 }
      )
    }

    // Verify the key belongs to the current user
    if (!s3Key.startsWith(`uploads/${userId}/`)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to this file" },
        { status: 403 }
      )
    }

    // Generate a signed URL valid for 1 hour
    const signedUrl = await getSignedUrlForObject(s3Key, 3600)

    return NextResponse.json({
      success: true,
      url: signedUrl,
    })
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate preview URL",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
