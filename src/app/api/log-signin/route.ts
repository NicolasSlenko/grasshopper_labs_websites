import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getJsonFromS3, putJsonToS3 } from "@/lib/aws/s3"

interface SignInLog {
    timestamp: string
    userAgent: string
}

interface SignInHistory {
    logs: SignInLog[]
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const key = `uploads/${userId}/sign-ins.json`
        let history = await getJsonFromS3<SignInHistory>(key)

        if (!history) {
            history = { logs: [] }
        }

        // Add new log
        const newLog: SignInLog = {
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get("user-agent") || "unknown"
        }

        // Keep only last 100 logins to prevent bloating
        const updatedLogs = [newLog, ...history.logs].slice(0, 100)

        await putJsonToS3(key, { logs: updatedLogs })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error logging sign-in:", error)
        return NextResponse.json({ error: "Failed to log sign-in" }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const key = `uploads/${userId}/sign-ins.json`
        const history = await getJsonFromS3<SignInHistory>(key)

        return NextResponse.json({ success: true, data: history?.logs || [] })
    } catch (error) {
        console.error("Error fetching sign-in logs:", error)
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }
}
