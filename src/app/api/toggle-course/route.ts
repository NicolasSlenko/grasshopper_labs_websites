import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getJsonFromS3, putJsonToS3 } from "@/lib/aws/s3"

interface CourseMatch {
  resumeCourse: string
  ufCourse: {
    name: string
    code: string
  }
  score: number
  category: string
}

// POST - Toggle a course (check/uncheck)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { courseCode, category, courseName, action } = await request.json()

    if (!courseCode || !category || !action) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: courseCode, category, and action" 
        },
        { status: 400 }
      )
    }

    // Read current matched courses from S3
    let data = await getJsonFromS3<any>(`uploads/${userId}/matched-courses.json`)
    if (!data) {
      data = { success: true, matches: [], byCategory: {}, allUFCourses: [], totalMatches: 0, ufCoursesScanned: 0 }
    }

    if (!data.byCategory) {
      data.byCategory = {}
    }

    // Initialize category if it doesn't exist
    if (!data.byCategory[category]) {
      data.byCategory[category] = []
    }

    const categoryMatches = data.byCategory[category]

    if (action === "check") {
      // Add the course if it's not already there
      const alreadyExists = categoryMatches.some(
        (match: CourseMatch) => match.ufCourse.code === courseCode
      )

      if (!alreadyExists) {
        const newMatch: CourseMatch = {
          resumeCourse: courseName || courseCode, // Use course name or code
          ufCourse: {
            name: courseName || "",
            code: courseCode,
          },
          score: 100, // Manual check = 100% match
          category: category,
        }
        categoryMatches.push(newMatch)
        
        // Also add to main matches array
        if (!data.matches) {
          data.matches = []
        }
        data.matches.push(newMatch)
      }
    } else if (action === "uncheck") {
      // Remove the course
      data.byCategory[category] = categoryMatches.filter(
        (match: CourseMatch) => match.ufCourse.code !== courseCode
      )
      
      // Also remove from main matches array
      if (data.matches) {
        data.matches = data.matches.filter(
          (match: CourseMatch) => match.ufCourse.code !== courseCode
        )
      }
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid action. Must be 'check' or 'uncheck'" 
        },
        { status: 400 }
      )
    }

    // Update lastUpdated timestamp
    data.lastUpdated = new Date().toISOString()

    // Save back to S3
    await putJsonToS3(`uploads/${userId}/matched-courses.json`, data)

    return NextResponse.json({
      success: true,
      message: `Course ${action === "check" ? "checked" : "unchecked"} successfully`,
      byCategory: data.byCategory,
    })
  } catch (error) {
    console.error("Error toggling course:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to toggle course",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
