"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Loader2, TrendingUp, UserCheck } from "lucide-react"

export function SignInChart() {
    const { isLoaded, isSignedIn } = useUser()
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return

        fetch("/api/log-signin")
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    // Process logs into daily counts
                    const logs = (json.data || []) as { timestamp: string }[]
                    console.log("Sign-in logs:", logs)
                    const counts: Record<string, number> = {}

                    logs.forEach(log => {
                        const date = new Date(log.timestamp).toLocaleDateString()
                        counts[date] = (counts[date] || 0) + 1
                    })

                    const chartData = Object.entries(counts).map(([date, count]) => ({
                        date,
                        count
                    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                    setData(chartData)
                }
            })
            .finally(() => setLoading(false))
    }, [isLoaded, isSignedIn])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Sign-In Activity
                </CardTitle>
                <CardDescription>Daily sign-in frequency</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="hsl(var(--primary))" name="Sign-ins" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <UserCheck className="h-8 w-8 mb-2 opacity-50" />
                            <p>No sign-in activity recorded yet.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
