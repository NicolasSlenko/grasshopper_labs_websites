"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Save, CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { ActionableInsight } from "@/lib/qualityAnalysis"

interface ActionableInsightsProps {
    insights: ActionableInsight[]
    onInsightsChange?: (insights: ActionableInsight[]) => void
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    projects: { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-600", border: "border-purple-200" },
    experience: { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-600", border: "border-blue-200" },
    skills: { bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-600", border: "border-green-200" },
    links: { bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-600", border: "border-orange-200" },
    gpa: { bg: "bg-yellow-50 dark:bg-yellow-950/20", text: "text-yellow-600", border: "border-yellow-200" },
    coursework: { bg: "bg-cyan-50 dark:bg-cyan-950/20", text: "text-cyan-600", border: "border-cyan-200" },
}

const priorityIcons = {
    high: AlertTriangle,
    medium: Info,
    low: Lightbulb,
}

const priorityColors = {
    high: "text-red-500",
    medium: "text-amber-500",
    low: "text-blue-500",
}

export function ActionableInsights({ insights: initialInsights, onInsightsChange }: ActionableInsightsProps) {
    const [insights, setInsights] = useState<ActionableInsight[]>(initialInsights)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        setInsights(initialInsights)
    }, [initialInsights])

    const handleToggle = (id: string) => {
        const updated = insights.map(insight =>
            insight.id === id ? { ...insight, checked: !insight.checked } : insight
        )
        setInsights(updated)
        setHasChanges(true)
        onInsightsChange?.(updated)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch("/api/insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    insights,
                    generatedAt: new Date().toISOString(),
                }),
            })

            if (!response.ok) throw new Error("Failed to save")

            toast.success("Progress saved!", {
                description: `${insights.filter(i => i.checked).length} items marked as done`,
            })
            setHasChanges(false)
        } catch (error) {
            toast.error("Failed to save progress", {
                description: "Please try again",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const completedCount = insights.filter(i => i.checked).length
    const totalCount = insights.length
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    // Group insights by priority
    const highPriority = insights.filter(i => i.priority === "high")
    const mediumPriority = insights.filter(i => i.priority === "medium")
    const lowPriority = insights.filter(i => i.priority === "low")

    const renderInsightItem = (insight: ActionableInsight) => {
        const colors = categoryColors[insight.category]
        const PriorityIcon = priorityIcons[insight.priority]

        return (
            <div
                key={insight.id}
                className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all",
                    insight.checked
                        ? "bg-muted/30 border-muted opacity-60"
                        : cn(colors.bg, colors.border)
                )}
            >
                <Checkbox
                    id={insight.id}
                    checked={insight.checked}
                    onCheckedChange={() => handleToggle(insight.id)}
                    className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                    <label
                        htmlFor={insight.id}
                        className={cn(
                            "text-sm cursor-pointer block",
                            insight.checked && "line-through text-muted-foreground"
                        )}
                    >
                        {insight.insight}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn("text-xs capitalize", colors.text)}>
                            {insight.category}
                        </Badge>
                    </div>
                </div>
                <PriorityIcon className={cn("h-4 w-4 flex-shrink-0", priorityColors[insight.priority])} />
            </div>
        )
    }

    if (insights.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Actionable Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p className="font-medium">Your resume looks great!</p>
                        <p className="text-sm mt-1">No improvements suggested at this time.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            Actionable Insights
                        </CardTitle>
                        <CardDescription>
                            Improvements to boost your resume score
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-2xl font-bold">{completedCount}/{totalCount}</p>
                            <p className="text-xs text-muted-foreground">{progressPercent}% done</p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            size="sm"
                        >
                            <Save className="h-4 w-4 mr-1" />
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-4">
                    <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* High Priority */}
                {highPriority.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            High Priority ({highPriority.filter(i => !i.checked).length} remaining)
                        </h4>
                        <div className="space-y-2">
                            {highPriority.map(renderInsightItem)}
                        </div>
                    </div>
                )}

                {/* Medium Priority */}
                {mediumPriority.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-600">
                            <Info className="h-4 w-4" />
                            Recommended ({mediumPriority.filter(i => !i.checked).length} remaining)
                        </h4>
                        <div className="space-y-2">
                            {mediumPriority.map(renderInsightItem)}
                        </div>
                    </div>
                )}

                {/* Low Priority */}
                {lowPriority.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-blue-600">
                            <Lightbulb className="h-4 w-4" />
                            Nice to Have ({lowPriority.filter(i => !i.checked).length} remaining)
                        </h4>
                        <div className="space-y-2">
                            {lowPriority.map(renderInsightItem)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
