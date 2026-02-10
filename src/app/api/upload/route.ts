import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { uploadToS3, getJsonFromS3, putJsonToS3 } from "@/lib/aws/s3"

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

export async function POST(request: NextRequest) {
  try {
    console.log("Upload endpoint called")

    const { userId } = await auth()

    if (!userId) {
      console.log("Unauthorized: No userId")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("User authenticated:", userId)

    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      console.log("No file in request")
      return NextResponse.json({ error: "No file received" }, { status: 400 })
    }

    console.log("File received:", file.name, file.type, file.size)

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.",
        },
        { status: 400 },
      )
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 10MB.",
        },
        { status: 400 },
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const safeName = file.name.replace(/[^\w.-]+/g, "-").toLowerCase()
    // Add timestamp to make each upload unique
    const timestamp = Date.now()
    const key = `uploads/${userId}/resumes/${timestamp}-${safeName}`

    console.log("Uploading to S3, key:", key)

    // Check AWS config
    if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_BUCKET_REGION ||
      !process.env.IAM_AWS_ACCESS_KEY || !process.env.IAM_AWS_SECRET_ACCESS_KEY) {
      console.error("AWS configuration missing")
      return NextResponse.json(
        { error: "Server configuration error: AWS credentials not configured" },
        { status: 500 }
      )
    }

    await uploadToS3(key, buffer, file.type || "application/octet-stream")

    // Track this submission in metadata
    const metadataKey = `uploads/${userId}/submissions-metadata.json`
    let metadata = await getJsonFromS3<SubmissionsMetadata>(metadataKey)

    const newSubmission: ResumeSubmission = {
      id: Buffer.from(key + timestamp).toString("base64"),
      fileName: file.name,
      s3Key: key,
      uploadedAt: new Date().toISOString(),
      // Generate a random score between 50-95 for now
      score: Math.floor(Math.random() * 46) + 50,
    }

    if (!metadata) {
      metadata = { submissions: [] }
    }

    metadata.submissions.unshift(newSubmission) // Add to beginning (most recent first)
    await putJsonToS3(metadataKey, metadata)

    return NextResponse.json({
      message: "File uploaded successfully",
      filename: key,
      size: file.size,
      type: file.type,
      submission: newSubmission,
    })
  } catch (error) {
    console.error("Error uploading file:", error)

    // Provide more detailed error message
    let errorMessage = "Failed to upload file"
    if (error instanceof Error) {
      errorMessage = error.message
      console.error("Error details:", error.stack)
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 },
    )
  }
}
