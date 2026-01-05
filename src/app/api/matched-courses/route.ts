import { NextResponse } from "next/server"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const MATCHED_COURSES_FILE = join(process.cwd(), "data", "matched-courses.json")

// GET - Retrieve cached matched courses
export async function GET() {
    try {
        // Check if matched courses file exists
        if (!existsSync(MATCHED_COURSES_FILE)) {
            return NextResponse.json({
                success: false,
                error: "No matched courses found",
                message: "Please upload and verify your resume first. Course matching will happen automatically."
            }, { status: 404 })
        }

        // Read matched courses from file
        const matchedCoursesString = await readFile(MATCHED_COURSES_FILE, "utf-8")
        const matchedCoursesData = JSON.parse(matchedCoursesString)

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
        if (existsSync(MATCHED_COURSES_FILE)) {
            await writeFile(MATCHED_COURSES_FILE, "", "utf-8")
        }

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
