"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Calendar,
  Eye,
  User,
  Mail,
  TrendingUp,
  Loader2,
  FileWarning,
  Trash2,
  AlertTriangle,
  Link as LinkIcon,
  BarChart3,
  Edit
} from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { ResumeEditor } from "@/components/profile/resume-editor"

import { useResume } from "@/contexts/resume-context"
import type { Resume } from "@/app/api/parse/resumeSchema"

interface ResumeSubmission {
  id: string
  fileName: string
  s3Key: string
  uploadedAt: string
  score: number
}

function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 85) return "default"
  if (score >= 70) return "secondary"
  return "destructive"
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatChartDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function ResumePreviewDialog({ submission }: { submission: ResumeSubmission }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPreview = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/resume-preview?key=${encodeURIComponent(submission.s3Key)}`)
      const result = await response.json()

      if (result.success) {
        setPreviewUrl(result.url)
      } else {
        setError(result.error || "Failed to load preview")
      }
    } catch (err) {
      setError("Failed to load preview")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={loadPreview}>
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {submission.fileName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-full min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <FileWarning className="h-12 w-12" />
              <p>{error}</p>
              <Button variant="outline" onClick={loadPreview}>
                Try Again
              </Button>
            </div>
          )}
          {previewUrl && !isLoading && !error && (
            <iframe
              src={previewUrl}
              className="w-full h-[calc(80vh-100px)] border rounded-lg"
              title={`Preview of ${submission.fileName}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ResumeSubmissionCard({ submission }: { submission: ResumeSubmission }) {
  const isPdf = submission.fileName.toLowerCase().endsWith(".pdf")

  return (
    <Card className="hover:shadow-md transition-shadow mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-muted">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate" title={submission.fileName}>
                {submission.fileName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(submission.uploadedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">Score</div>
              <Badge variant={getScoreBadgeVariant(submission.score)} className="text-sm font-bold">
                {submission.score}
              </Badge>
            </div>
            <div className="flex gap-2">
              {isPdf && <ResumePreviewDialog submission={submission} />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{payload[0].payload.fileName}</p>
        <p className="text-xs text-muted-foreground">{payload[0].payload.fullDate}</p>
        <p className="text-sm font-bold mt-1">
          Score: <span className="text-primary">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

function ScoreHistoryChart({ submissions }: { submissions: ResumeSubmission[] }) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const chartData = [...submissions]
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .map((s, index) => ({
      date: formatChartDate(s.uploadedAt),
      fullDate: formatDate(s.uploadedAt),
      score: s.score,
      fileName: s.fileName,
      index: index + 1,
    }))

  const chartColor = isDark ? "#ffffff" : "hsl(var(--primary))"
  const gridColor = isDark ? "#333333" : "hsl(var(--muted))"

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Experience Evolution
        </CardTitle>
        <CardDescription>
          Tracking resume score improvements over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fontSize: 12, fill: isDark ? '#ffffff' : 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs"
                tick={{ fontSize: 12, fill: isDark ? '#ffffff' : 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<ScoreChartTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={{ r: 4, fill: chartColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function ClearSubmissionsDialog({ onConfirm, isClearing, trigger }: { onConfirm: () => void, isClearing: boolean, trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Clear All?</DialogTitle>
          <DialogDescription>Irreversible action. Deletes all past submissions.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={isClearing}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  // Ensure typed as unknown first to avoid incompatibility if interface changed
  const { resumeData, setResumeData, refreshResumeData, showFeedback, toggleFeedback } = useResume()

  const [submissions, setSubmissions] = useState<ResumeSubmission[]>([])
  const [isLoadingSubs, setIsLoadingSubs] = useState(true)
  const [isClearing, setIsClearing] = useState(false)


  // Fetch submissions independently from resumeData context
  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/resume-submissions")
      const result = await response.json()
      if (result.success) setSubmissions(result.data)
    } catch (err) {
      console.error("Failed to fetch submissions")
    } finally {
      setIsLoadingSubs(false)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      fetchSubmissions()
    }
  }, [isLoaded])

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      const res = await fetch("/api/resume-submissions", { method: "DELETE" })
      if (res.ok) {
        setSubmissions([])
        setResumeData(null) // Clear resume data from context
        await refreshResumeData() // Re-fetch (will find nothing → null)
        toast.success("Cleared all resume data")
      }
    } finally {
      setIsClearing(false)
    }
  }

  const handleSaveResume = async (data: Resume) => {
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (result.success) {
        await refreshResumeData()
      } else {
        throw new Error(result.error)
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        {/* User Stats Header */}
        <div className="flex items-center justify-between gap-4 mb-8 bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="h-16 w-16 rounded-full border-2 border-primary/20" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center"><User className="h-8 w-8" /></div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{user?.fullName || "Your Profile"}</h1>
              <div className="text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showFeedback}
              onChange={toggleFeedback}
              className="h-4 w-4 rounded border-muted-foreground"
            />
            <span className="text-sm text-muted-foreground">Show AI Feedback</span>
          </label>
        </div>

        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="editor" className="gap-2"><Edit className="h-4 w-4" /> Editor</TabsTrigger>
            <TabsTrigger value="stats" className="gap-2"><BarChart3 className="h-4 w-4" /> Statistics</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><Calendar className="h-4 w-4" /> History</TabsTrigger>
          </TabsList>

          {/* Tab: Resume Editor (The "Big Section") */}
          <TabsContent value="editor" className="space-y-4">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Scrollable Past Resumes Sidebar */}
              <Card className="md:col-span-1 h-fit flex flex-col border-dashed">
                <CardHeader className="py-4">
                  <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-4 w-4" /> Past Uploads</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[400px] md:h-[600px]">
                    <div className="p-4 space-y-2">
                      {submissions.map(sub => (
                        <div key={sub.id} className="text-sm p-3 border rounded-lg hover:bg-muted/50 transition-colors group bg-card">
                          <div className="font-medium truncate mb-1">{sub.fileName}</div>
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{formatChartDate(sub.uploadedAt)}</span>
                            <Badge variant="secondary" className="text-[10px] h-5">{sub.score}</Badge>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground/50 italic">
                            Preview only
                          </div>
                        </div>
                      ))}
                      {submissions.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">No uploads yet</div>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Main Editor */}
              <div className="md:col-span-3">
                {resumeData ? (
                  <ResumeEditor initialData={resumeData} onSave={handleSaveResume} />
                ) : (
                  <Card className="flex flex-col items-center justify-center p-12 text-center h-[400px] border-dashed">
                    <FileText className="h-12 w-12 opacity-20 mb-4" />
                    <h3 className="text-lg font-semibold">No Resume Data</h3>
                    <p className="text-muted-foreground mb-4">Upload a resume to populate this editor</p>
                    <Button asChild><a href="/">Upload Resume</a></Button>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Statistics */}
          <TabsContent value="stats" className="space-y-6">
            {/* Stats Summary Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold">{submissions.length}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Uploads</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {submissions.length > 0 ? Math.round(submissions.reduce((a, b) => a + b.score, 0) / submissions.length) : 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Average Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {submissions.length > 0 ? Math.max(...submissions.map(s => s.score)) : 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Best Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold">
                    {submissions.length > 0 ? submissions.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]?.score : 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Current Score</div>
                </CardContent>
              </Card>
            </div>

            <ScoreHistoryChart submissions={submissions} />

          </TabsContent>

          {/* Tab: History (Original View) */}
          <TabsContent value="history">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Detailed Submission History</CardTitle>
                {submissions.length > 0 && (
                  <ClearSubmissionsDialog
                    onConfirm={handleClearAll}
                    isClearing={isClearing}
                    trigger={<Button variant="outline" size="sm" className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Clear History</Button>}
                  />
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No resume submissions yet</p>
                    <Button className="mt-4" asChild>
                      <a href="/">Upload Resume</a>
                    </Button>
                  </div>
                ) : (
                  submissions.map(s => <ResumeSubmissionCard key={s.id} submission={s} />)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  )
}
