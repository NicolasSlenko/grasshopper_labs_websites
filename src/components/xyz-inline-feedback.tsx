"use client"

import { Badge } from "@/components/ui/badge"
import { Wand2 } from "lucide-react"

interface XYZFeedback {
    score: number
    xyz_analysis: string
    improvements: string[]
}

interface XYZInlineFeedbackProps {
    feedback?: XYZFeedback | null
}

export function XYZInlineFeedback({ feedback }: XYZInlineFeedbackProps) {
    if (!feedback) return null

    return (
        <div className="mt-2 border rounded-lg p-3 bg-muted/10 space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Wand2 className="h-3 w-3" />
                    XYZ Formula Analysis
                </div>
                <Badge variant="outline" className="text-xs font-bold">
                    {feedback.score}/100
                </Badge>
            </div>

            <p className="text-xs text-muted-foreground">{feedback.xyz_analysis}</p>
            {feedback.improvements.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs font-medium">Suggestions:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                        {feedback.improvements.map((imp, i) => (
                            <li key={i} className="text-xs text-muted-foreground">{imp}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
