"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Resume } from "@/app/api/parse/resumeSchema"

interface ResumeSubmission {
  id: string
  fileName: string
  s3Key: string
  uploadedAt: string
  score: number
}

interface XYZFeedbackItem {
  score: number
  xyz_analysis: string
  improvements: string[]
}

interface XYZFeedbackData {
  projects: Record<number, XYZFeedbackItem>
  experience: Record<number, XYZFeedbackItem>
  actionableInsights?: ActionableInsight[]
}

interface ActionableInsight {
  id: string
  category: string
  insight: string
  priority: "high" | "low"
  checked: boolean
}

interface ResumeContextType {
  resumeData: Resume | null
  setResumeData: (data: Resume | null) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  refreshResumeData: () => Promise<void>
  currentFileName: string | null
  setCurrentFileName: (name: string | null) => void
  xyzFeedback: XYZFeedbackData | null
  actionableInsights: ActionableInsight[]
  showFeedback: boolean
  toggleFeedback: () => void
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined)

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumeData, setResumeData] = useState<Resume | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [xyzFeedback, setXyzFeedback] = useState<XYZFeedbackData | null>(null)
  const [actionableInsights, setActionableInsights] = useState<ActionableInsight[]>([])
  const [showFeedback, setShowFeedback] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("showAiFeedback")
      return stored !== null ? stored === "true" : true // default to true
    }
    return true
  })

  const toggleFeedback = () => {
    setShowFeedback(prev => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("showAiFeedback", String(next))
      }
      return next
    })
  }

  // Load resume data from JSON file on mount
  const loadResumeData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/resume")
      if (response.status === 401) {
        setResumeData(null)
        return
      }
      const result = await response.json()

      if (result.success && result.data) {
        setResumeData(result.data)
        console.log("Resume data loaded from cloud storage:", result.data)
      } else {
        setResumeData(null)
        console.log("No resume data found for this user")
      }

      // Also fetch the most recent submission to get filename
      const submissionsResponse = await fetch("/api/resume-submissions")
      if (submissionsResponse.ok) {
        const submissionsResult = await submissionsResponse.json()
        if (submissionsResult.success && submissionsResult.data?.length > 0) {
          // Get the most recent submission (first one since sorted by date desc)
          setCurrentFileName(submissionsResult.data[0].fileName)
        }
      }

      // Load cached XYZ feedback
      try {
        const feedbackResponse = await fetch("/api/analyze/xyz-batch")
        if (feedbackResponse.ok) {
          const feedbackResult = await feedbackResponse.json()
          if (feedbackResult.success && feedbackResult.data) {
            setXyzFeedback(feedbackResult.data)
            if (feedbackResult.data.actionableInsights) {
              setActionableInsights(feedbackResult.data.actionableInsights)
            }
          } else if (result.success && result.data) {
            // No cached feedback — auto-generate it in the background
            generateXyzFeedback(result.data)
          }
        } else if (result.success && result.data) {
          generateXyzFeedback(result.data)
        }
      } catch {
        // No cached feedback found — auto-generate if resume data exists
        if (result.success && result.data) {
          generateXyzFeedback(result.data)
        }
      }
    } catch (error) {
      console.error("Error loading resume data:", error)
      setResumeData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-generate XYZ feedback when none is cached
  const generateXyzFeedback = async (data: Resume) => {
    try {
      const response = await fetch("/api/analyze/xyz-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: data }),
      })
      const result = await response.json()
      if (result.success && result.data) {
        setXyzFeedback(result.data)
        if (result.data.actionableInsights) {
          setActionableInsights(result.data.actionableInsights)
        }
      }
    } catch (error) {
      console.error("Error generating XYZ feedback:", error)
    }
  }

  // Load on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadResumeData()
  }, [])

  return (
    <ResumeContext.Provider
      value={{
        resumeData,
        setResumeData,
        isLoading,
        setIsLoading,
        refreshResumeData: loadResumeData,
        currentFileName,
        setCurrentFileName,
        xyzFeedback,
        actionableInsights,
        showFeedback,
        toggleFeedback,
      }}
    >
      {children}
    </ResumeContext.Provider>
  )
}

export function useResume() {
  const context = useContext(ResumeContext)
  if (context === undefined) {
    throw new Error("useResume must be used within a ResumeProvider")
  }
  return context
}
