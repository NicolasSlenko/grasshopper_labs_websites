"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Wand2 } from "lucide-react"
import { toast } from "sonner"

interface XYZFeedbackDialogProps {
    text: string
    type: string
    trigger?: React.ReactNode
}

export function XYZFeedbackDialog({ text, type, trigger }: XYZFeedbackDialogProps) {
    const [feedback, setFeedback] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const analyze = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/analyze/xyz", {
                method: "POST",
                body: JSON.stringify({ text, type }),
            })
            const data = await res.json()
            if (data.success) {
                setFeedback(data.data)
            } else {
                toast.error("Failed to generate feedback")
            }
        } catch (e) {
            toast.error("Error analyzing text")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2" onClick={(e) => {
                        e.stopPropagation()
                    }}>
                        <Wand2 className="h-3 w-3" />
                        Analyze (XYZ)
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>XYZ Formula Analysis</DialogTitle>
                </DialogHeader>
                {!feedback && !loading && (
                    <div className="flex flex-col items-center justify-center p-6 gap-4">
                        <p className="text-center text-muted-foreground">
                            Analyze this description to see if it follows Google's XYZ formula:
                            <br />
                            <em>"Accomplished [X] as measured by [Y], by doing [Z]"</em>
                        </p>
                        <Button onClick={analyze}>Generate Analysis</Button>
                    </div>
                )}
                {loading && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {feedback && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Score:</span>
                            <span className={`text-lg font-bold ${feedback.score >= 80 ? 'text-green-500' : feedback.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {feedback.score}/100
                            </span>
                        </div>
                        <div className="bg-muted p-3 rounded-md text-sm">
                            {feedback.xyz_analysis}
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Suggested Improvements:</h4>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                {feedback.improvements.map((imp: string, i: number) => (
                                    <li key={i}>{imp}</li>
                                ))}
                            </ul>
                        </div>
                        <Button variant="outline" size="sm" onClick={analyze}>Regenerate</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
