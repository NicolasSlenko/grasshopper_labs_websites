"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Lightbulb, Loader2, AlertTriangle, Info, Target,
    Sparkles, RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface InsightItem {
    id: string
    title: string
    description: string
    priority: "high" | "medium" | "low"
    category: string
    targetRole?: string
    checked?: boolean
}

interface LLMInsightsProps {
    resumeData: any
    preferences?: {
        roleTypes?: string[]
        techSectors?: string[]
    } | null
}

const priorityConfig = {
    high: { icon: AlertTriangle, color: "text-red-500", label: "High Priority" },
    medium: { icon: Info, color: "text-amber-500", label: "Recommended" },
    low: { icon: Lightbulb, color: "text-blue-500", label: "Nice to Have" },
}

export function LLMInsights({ resumeData, preferences }: LLMInsightsProps) {
    const [insights, setInsights] = useState<{ general: InsightItem[]; preferenceSpecific: InsightItem[] } | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const generate = async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await fetch("/api/analyze/insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeData, preferences }),
            })
            const data = await res.json()
            if (data.success && data.data) {
                // Add checked state to each insight
                const addChecked = (items: InsightItem[]) =>
                    items.map(item => ({ ...item, checked: false }))
                setInsights({
                    general: addChecked(data.data.general),
                    preferenceSpecific: addChecked(data.data.preferenceSpecific),
                })
            } else {
                setError(true)
                toast.error("Failed to generate insights")
            }
        } catch (e) {
            setError(true)
            toast.error("Error generating insights")
        } finally {
            setLoading(false)
        }
    }

    const toggleInsight = (section: "general" | "preferenceSpecific", id: string) => {
        if (!insights) return
        setInsights({
            ...insights,
            [section]: insights[section].map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            ),
        })
    }

    const renderInsight = (item: InsightItem, section: "general" | "preferenceSpecific") => {
        const config = priorityConfig[item.priority]
        const PriorityIcon = config.icon

        return (
            <div
                key={item.id}
                className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all",
                    item.checked ? "bg-muted/30 border-muted opacity-60" : "bg-card"
                )}
            >
                <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={() => toggleInsight(section, item.id)}
                    className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                    <label
                        htmlFor={item.id}
                        className={cn(
                            "text-sm font-medium cursor-pointer block",
                            item.checked && "line-through text-muted-foreground"
                        )}
                    >
                        {item.title}
                    </label>
                    <p className={cn("text-xs text-muted-foreground mt-1", item.checked && "line-through")}>
                        {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] capitalize">{item.category}</Badge>
                        {item.targetRole && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                                <Target className="h-2.5 w-2.5" />
                                {item.targetRole}
                            </Badge>
                        )}
                    </div>
                </div>
                <PriorityIcon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", config.color)} />
            </div>
        )
    }

    if (!insights && !loading) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="h-10 w-10 text-primary/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">AI-Powered Resume Insights</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md">
                        Get personalized recommendations to improve your resume, including suggestions tailored to your target roles.
                    </p>
                    <Button onClick={generate} size="lg" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Generate Insights
                    </Button>
                    {error && (
                        <p className="text-xs text-destructive mt-3">Failed to generate. Please try again.</p>
                    )}
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Analyzing your resume with AI...</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                </CardContent>
            </Card>
        )
    }

    if (!insights) return null

    const generalRemaining = insights.general.filter(i => !i.checked).length
    const prefRemaining = insights.preferenceSpecific.filter(i => !i.checked).length
    const totalDone = insights.general.filter(i => i.checked).length + insights.preferenceSpecific.filter(i => i.checked).length
    const total = insights.general.length + insights.preferenceSpecific.length

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Resume Insights
                        </CardTitle>
                        <CardDescription>
                            {totalDone}/{total} completed
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="gap-2">
                        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                        Regenerate
                    </Button>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-3">
                    <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${total > 0 ? Math.round((totalDone / total) * 100) : 0}%` }}
                    />
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* General Recommendations */}
                {insights.general.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            General Recommendations
                            <Badge variant="secondary" className="text-[10px]">{generalRemaining} remaining</Badge>
                        </h4>
                        <div className="space-y-2">
                            {insights.general.map(item => renderInsight(item, "general"))}
                        </div>
                    </div>
                )}

                {/* Preference-Based Recommendations */}
                {insights.preferenceSpecific.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Tailored to Your Career Goals
                            <Badge variant="secondary" className="text-[10px]">{prefRemaining} remaining</Badge>
                        </h4>
                        <div className="space-y-2">
                            {insights.preferenceSpecific.map(item => renderInsight(item, "preferenceSpecific"))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
