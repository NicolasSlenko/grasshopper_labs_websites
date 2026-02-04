import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { uploadToS3 } from "@/lib/aws/s3"

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
    const key = `uploads/${userId}/resumes/${safeName}`

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

    console.log("Upload successful")

    return NextResponse.json({
      message: "File uploaded successfully",
      filename: key,
      size: file.size,
      type: file.type,
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
