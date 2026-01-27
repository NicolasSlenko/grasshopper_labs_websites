import { type NextRequest, NextResponse } from "next/server"

interface UFMeetTime {
  meetDays: string[]
  meetPeriodBegin: number
  meetPeriodEnd: number
}

interface UFSection {
  classNumber: string
  credits: number
  meetTimes: UFMeetTime[]
}

interface UFCourse {
  name: string
  code: string
  sections: UFSection[]
}

interface UFApiResponse {
  COURSES: UFCourse[]
}

// Base URL for UF Schedule of Courses API
const UF_API_BASE_URL = "https://one.ufl.edu/apix/soc/schedule/"

/**
 * Fetch course data from UF API
 * @param courseCode - Course code (e.g., "COP3530", "COP")
 * @param term - Term code (e.g., "2251" for Spring 2025)
 */
async function fetchUFCourse(courseCode: string, term: string = "2251") {
  const params = new URLSearchParams({
    category: "CWSP",
    term: term,
    "course-code": courseCode,
    "last-row": "0",
  })

  try {
    const response = await fetch(`${UF_API_BASE_URL}?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`UF API returned status ${response.status}`)
    }

    const data: UFApiResponse[] = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching UF course ${courseCode}:`, error)
    return null
  }
}

/**
 * Parse UF API response into simplified course objects
 */
function parseUFCourses(apiResponses: UFApiResponse[]): UFCourse[] {
  const courses: UFCourse[] = []

  for (const response of apiResponses) {
    const responseCourses = response.COURSES || []
    
    for (const course of responseCourses) {
      courses.push({
        name: course.name || "",
        code: course.code || "",
        sections: course.sections || [],
      })
    }
  }

  return courses
}

// GET - Fetch specific course(s)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const courseCodes = searchParams.get("codes")?.split(",") || []
    const term = searchParams.get("term") || "2251"

    if (courseCodes.length === 0) {
      return NextResponse.json(
        { error: "No course codes provided" },
        { status: 400 }
      )
    }

    const allCourses: UFCourse[] = []

    // Fetch each course
    for (const code of courseCodes) {
      const trimmedCode = code.trim()
      if (trimmedCode) {
        const data = await fetchUFCourse(trimmedCode, term)
        if (data) {
          const parsed = parseUFCourses(data)
          allCourses.push(...parsed)
        }
      }
    }

    return NextResponse.json({
      success: true,
      courses: allCourses,
      count: allCourses.length,
    })
  } catch (error) {
    console.error("Error in UF courses API:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch UF courses",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST - Fetch multiple courses from department prefixes
export async function POST(request: NextRequest) {
  try {
    const { prefixes, term = "2251" } = await request.json()

    if (!prefixes || !Array.isArray(prefixes)) {
      return NextResponse.json(
        { error: "Invalid prefixes array" },
        { status: 400 }
      )
    }

    const allCourses: UFCourse[] = []

    // Fetch courses for each prefix (e.g., "COP", "CDA", "CAP")
    for (const prefix of prefixes) {
      const data = await fetchUFCourse(prefix, term)
      if (data) {
        const parsed = parseUFCourses(data)
        allCourses.push(...parsed)
      }
    }

    return NextResponse.json({
      success: true,
      courses: allCourses,
      count: allCourses.length,
    })
  } catch (error) {
    console.error("Error in UF courses API POST:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch UF courses",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
