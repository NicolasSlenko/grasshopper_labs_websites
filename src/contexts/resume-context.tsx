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

interface ResumeContextType {
  resumeData: Resume | null
  setResumeData: (data: Resume | null) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  refreshResumeData: () => Promise<void>
  currentFileName: string | null
  setCurrentFileName: (name: string | null) => void
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined)

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resumeData, setResumeData] = useState<Resume | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)

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
    } catch (error) {
      console.error("Error loading resume data:", error)
      setResumeData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Load on mount
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
