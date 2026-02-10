"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Calendar,
  Eye,
  Download,
  User,
  Mail,
  TrendingUp,
  Loader2,
  FileWarning,
  Trash2,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts"
import { useTheme } from "next-themes"

interface ResumeSubmission {
  id: string
  fileName: string
  s3Key: string
  uploadedAt: string
  score: number
}

function getScoreColor(score: number): string {
  if (score >= 85) return "bg-green-500"
  if (score >= 70) return "bg-yellow-500"
  if (score >= 55) return "bg-orange-500"
  return "bg-red-500"
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
    <Card className="hover:shadow-md transition-shadow">
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
            {/* Score Badge */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground">Score</div>
              <Badge variant={getScoreBadgeVariant(submission.score)} className="text-sm font-bold">
                {submission.score}
              </Badge>
            </div>

            {/* Score Progress Bar */}
            <div className="hidden sm:block w-24">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreColor(submission.score)} transition-all`}
                  style={{ width: `${submission.score}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isPdf && <ResumePreviewDialog submission={submission} />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Custom tooltip for the score chart
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

// Score over time chart component
function ScoreHistoryChart({ submissions }: { submissions: ResumeSubmission[] }) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  if (submissions.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Score History
          </CardTitle>
          <CardDescription>
            Submit at least 2 resumes to see your score trend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">Upload more resumes to track your progress over time</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort submissions chronologically (oldest first) for the chart
  const chartData = [...submissions]
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .map((s, index) => ({
      date: formatChartDate(s.uploadedAt),
      fullDate: formatDate(s.uploadedAt),
      score: s.score,
      fileName: s.fileName,
      index: index + 1,
    }))

  const avgScore = Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length)
  const maxScore = Math.max(...submissions.map(s => s.score))
  const minScore = Math.min(...submissions.map(s => s.score))
  const latestScore = chartData[chartData.length - 1]?.score || 0
  const previousScore = chartData.length >= 2 ? chartData[chartData.length - 2]?.score || 0 : 0
  const scoreDiff = latestScore - previousScore

  // Chart styling based on theme
  const chartColor = isDark ? "#ffffff" : "hsl(var(--primary))"
  const gridColor = isDark ? "#333333" : "hsl(var(--muted))"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score History
            </CardTitle>
            <CardDescription>
              Track how your resume score has changed over time
            </CardDescription>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Latest</div>
              <div className="text-lg font-bold">{latestScore}</div>
              {scoreDiff !== 0 && (
                <div className={`text-xs font-medium ${scoreDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Best</div>
              <div className="text-lg font-bold text-green-500">{maxScore}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg</div>
              <div className="text-lg font-bold text-muted-foreground">{avgScore}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
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
                domain={[Math.max(0, minScore - 10), 100]}
                className="text-xs"
                tick={{ fontSize: 12, fill: isDark ? '#ffffff' : 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<ScoreChartTooltip />} />
              <ReferenceLine
                y={avgScore}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                label={{ value: "Avg", position: "right", fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#scoreGradient)"
                dot={{ r: 4, fill: chartColor }}
                activeDot={{ r: 6, fill: chartColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function ClearSubmissionsDialog({
  onConfirm,
  isClearing,
  trigger
}: {
  onConfirm: () => void,
  isClearing: boolean,
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Clear All Submissions?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete all your resume submissions and their scores from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={isClearing}>
            {isClearing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Yes, Clear All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [submissions, setSubmissions] = useState<ResumeSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("/api/resume-submissions")
        const result = await response.json()

        if (result.success) {
          setSubmissions(result.data)
        } else {
          setError(result.error || "Failed to fetch submissions")
        }
      } catch (err) {
        setError("Failed to fetch submissions")
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded) {
      fetchSubmissions()
    }
  }, [isLoaded])

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      const response = await fetch("/api/resume-submissions", {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        setSubmissions([])
        toast.success("All submissions cleared")
      } else {
        toast.error(result.error || "Failed to clear submissions")
      }
    } catch (err) {
      toast.error("Failed to clear submissions")
    } finally {
      setIsClearing(false)
    }
  }

  const averageScore = submissions.length > 0
    ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / submissions.length)
    : 0

  const highestScore = submissions.length > 0
    ? Math.max(...submissions.map(s => s.score))
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* User Avatar & Info */}
                <div className="flex items-center gap-4">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || "Profile"}
                      className="h-20 w-20 rounded-full border-4 border-primary/20"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold">
                      {user?.fullName || "Your Profile"}
                    </h1>
                    {user?.primaryEmailAddress && (
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Mail className="h-4 w-4" />
                        <span>{user.primaryEmailAddress.emailAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator orientation="vertical" className="hidden md:block h-16" />

                {/* Stats */}
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{submissions.length}</div>
                    <div className="text-sm text-muted-foreground">Submissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{averageScore}</div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{highestScore}</div>
                    <div className="text-sm text-muted-foreground">Best Score</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resume Submissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume Submissions
                </CardTitle>
                <CardDescription className="mt-1">
                  View your past resume submissions and their scores
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {submissions.length > 0 && (
                  <ClearSubmissionsDialog
                    onConfirm={handleClearAll}
                    isClearing={isClearing}
                    trigger={
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isClearing}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    }
                  />
                )}
                <Button asChild>
                  <a href="/">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upload New Resume
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileWarning className="h-12 w-12 mx-auto mb-4" />
                <p>{error}</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No resume submissions yet</p>
                <p className="mt-1">Upload your first resume to get started!</p>
                <Button className="mt-4" asChild>
                  <a href="/">Upload Resume</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <ResumeSubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score History Chart - Below Submissions */}
        {!isLoading && submissions.length > 0 && (
          <div className="mt-6">
            <ScoreHistoryChart submissions={submissions} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
