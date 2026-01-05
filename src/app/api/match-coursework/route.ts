import { type NextRequest, NextResponse } from "next/server"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { extractCoursework, matchCoursework, categorizeUFCourse, UF_CS_PREFIXES } from "@/lib/courseMatching"

const RESUME_DATA_FILE = join(process.cwd(), "data", "resume-data.json")
const MATCHED_COURSES_FILE = join(process.cwd(), "data", "matched-courses.json")
const UF_API_BASE_URL = "https://one.ufl.edu/apix/soc/schedule/"

interface UFApiResponse {
  COURSES: Array<{
    name: string
    code: string
    sections: any[]
  }>
}

/**
 * Fetch UF courses by prefix
 */
async function fetchUFCoursesByPrefix(prefix: string, term: string = "2251") {
  const params = new URLSearchParams({
    category: "CWSP",
    term: term,
    "course-code": prefix,
    "last-row": "0",
  })

  try {
    const response = await fetch(`${UF_API_BASE_URL}?${params.toString()}`)

    if (!response.ok) {
      console.error(`UF API returned status ${response.status} for prefix ${prefix}`)
      return []
    }

    const data: UFApiResponse[] = await response.json()
    const courses: Array<{ name: string; code: string }> = []

    for (const responseItem of data) {
      const responseCourses = responseItem.COURSES || []
      for (const course of responseCourses) {
        courses.push({
          name: course.name || "",
          code: course.code || "",
        })
      }
    }

    return courses
  } catch (error) {
    console.error(`Error fetching UF courses for prefix ${prefix}:`, error)
    return []
  }
}

// GET - Match resume coursework to UF courses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const term = searchParams.get("term") || "2251"
    const threshold = parseInt(searchParams.get("threshold") || "60")

    // Load resume data
    if (!existsSync(RESUME_DATA_FILE)) {
      return NextResponse.json({
        success: false,
        error: "No resume data found",
        message: "Please upload and verify your resume first"
      }, { status: 404 })
    }

    const resumeDataString = await readFile(RESUME_DATA_FILE, "utf-8")
    const resumeData = JSON.parse(resumeDataString)

    // Extract coursework from resume
    const achievements = resumeData.education?.[0]?.achievements || []
    const resumeCourses = extractCoursework(achievements)

    if (resumeCourses.length === 0) {
      const emptyData = {
        success: true,
        matches: [],
        resumeCourses: [],
        byCategory: {},
        allUFCourses: [],
        totalMatches: 0,
        ufCoursesScanned: 0,
        lastUpdated: new Date().toISOString(),
        message: "No relevant coursework found in resume"
      }

      // Save empty state to file so /api/matched-courses doesn't 404
      try {
        await writeFile(MATCHED_COURSES_FILE, JSON.stringify(emptyData, null, 2), "utf-8")
        console.log("Saved empty matched courses to file")
      } catch (saveError) {
        console.error("Error saving matched courses to file:", saveError)
      }

      return NextResponse.json(emptyData)
    }

    console.log(`Found ${resumeCourses.length} courses in resume:`, resumeCourses)

    // Fetch UF courses from all CS prefixes
    console.log("Fetching UF courses from API...")
    const allUFCourses: Array<{ name: string; code: string }> = []

    for (const prefix of UF_CS_PREFIXES) {
      const courses = await fetchUFCoursesByPrefix(prefix, term)
      allUFCourses.push(...courses)
      console.log(`Fetched ${courses.length} courses for prefix ${prefix}`)
    }

    console.log(`Total UF courses fetched: ${allUFCourses.length}`)

    // Filter for undergraduate courses (3000-4000 level only, exclude specific courses)
    const excludedCourses = [
      "COP2271", "COP2271L", // Excluded by user request
      /CIS4930/, /EEL4930/    // Generic special topics courses
    ]

    const undergraduateCourses = allUFCourses.filter(course => {
      // Extract the numeric part from course code (e.g., "COP3530" -> 3530)
      const match = course.code.match(/(\d+)/)
      if (!match) return false

      const courseNumber = parseInt(match[1])

      // Only courses 3000-4999 (exclude 2000 and below)
      if (courseNumber < 3000 || courseNumber > 4999) return false

      // Exclude specific courses
      const isExcluded = excludedCourses.some(excluded => {
        if (excluded instanceof RegExp) {
          return excluded.test(course.code)
        }
        return course.code === excluded
      })

      return !isExcluded
    })

    console.log(`Filtered to ${undergraduateCourses.length} undergraduate courses (3000-4000 level, excluding special topics)`)

    // Log all scanned courses
    console.log("\n========== ALL SCANNED UF COURSES (UNDERGRADUATE) ==========")
    undergraduateCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.code} - ${course.name}`)
    })
    console.log("============================================\n")

    // Match resume courses to UF courses
    const matches = matchCoursework(resumeCourses, undergraduateCourses, threshold)

    // Categorize matched courses
    const categorizedMatches = matches.map(match => ({
      ...match,
      category: categorizeUFCourse(match.ufCourse.code, match.ufCourse.name)
    }))

    // Group by category
    const byCategory: Record<string, typeof categorizedMatches> = {}
    for (const match of categorizedMatches) {
      if (!byCategory[match.category]) {
        byCategory[match.category] = []
      }
      byCategory[match.category].push(match)
    }

    // Also categorize ALL UF courses for display (filter out excluded ones)
    const allCategorizedCourses = undergraduateCourses
      .map(course => ({
        ...course,
        category: categorizeUFCourse(course.code, course.name)
      }))
      .filter(course => course.category !== "EXCLUDED") // Remove excluded courses

    // Prepare response data
    const responseData = {
      success: true,
      resumeCourses,
      matches: categorizedMatches,
      byCategory,
      allUFCourses: allCategorizedCourses,
      totalMatches: matches.length,
      ufCoursesScanned: allCategorizedCourses.length,
      lastUpdated: new Date().toISOString()
    }

    // Save matched courses to file for later retrieval
    try {
      await writeFile(MATCHED_COURSES_FILE, JSON.stringify(responseData, null, 2), "utf-8")
      console.log("Saved matched courses to file")
    } catch (saveError) {
      console.error("Error saving matched courses to file:", saveError)
      // Continue anyway - this is not critical
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error in course matching API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to match coursework",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
