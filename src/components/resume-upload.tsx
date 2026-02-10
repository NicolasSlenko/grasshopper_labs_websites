"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertCircle, X, Rocket, Loader2, FileUp, Edit, ArrowLeft, Cpu } from "lucide-react"
import type { Resume } from "@/app/api/parse/resumeSchema"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { ResumeVerification } from "@/components/resume-verification"
import { useResume } from "@/contexts/resume-context"
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"

interface UploadedFile {
  name: string
  size: number
  type: string
  uploadedAt: string
  filename: string
}

interface ParseResult {
  details: Resume | null
  missing: string[]
}

export function ResumeUpload() {
  const { setResumeData, setCurrentFileName } = useResume()
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verifiedData, setVerifiedData] = useState<Resume | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    setUploadStatus("idle")
    setErrorMessage("")
    setUploadedFile(null)
    setParseResult(null)

    try {
      const file = acceptedFiles[0]
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        cache: "no-store",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()

      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        filename: result.filename,
      })

      setUploadStatus("success")
      toast.success("File uploaded successfully!")
    } catch (error) {
      setUploadStatus("error")
      setErrorMessage("Failed to upload file. Please try again.")
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const parseResume = async () => {
    if (!uploadedFile) return

    setIsParsing(true)

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: uploadedFile.filename,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("API Error:", result)
        throw new Error(result.message || result.error || "Failed to parse")
      }

      setParseResult(result)

      // Log the full JSON output to console for debugging
      console.log("==========================================")
      console.log("PARSED RESUME OUTPUT (SEMANTIC PARSER):")
      console.log("==========================================")
      console.log(JSON.stringify(result, null, 2))
      console.log("==========================================")

      // Show verification form after successful parse
      if (result.details) {
        setShowVerification(true)
        toast.success("Resume parsed successfully with AI!")
      }
    } catch (error) {
      console.error("Error parsing:", error)
      setParseResult({ details: null, missing: ["Failed to parse"] })
      const errorMsg = error instanceof Error ? error.message : "Failed to parse resume"
      toast.error(errorMsg)
    } finally {
      setIsParsing(false)
    }
  }

  const exportJSON = async (method: string) => {
    if (!parseResult) return
    const data = JSON.stringify(parseResult)

    if (method === "download") {
      const download = document.createElement("a")
      download.href = `data:application/json;charset=utf-8,${JSON.stringify(data)}`
      download.setAttribute("download", "resume.json")
      download.click()
    } else if (method === "clipboard") {
      await navigator.clipboard.writeText(data)
      toast.info("Copied to Clipboard")
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setParseResult(null)
    setShowVerification(false)
    setVerifiedData(null)
    setUploadStatus("idle")
  }

  const handleVerificationConfirm = async (data: Resume) => {
    setVerifiedData(data)
    setResumeData(data) // Save to global context

    // Update the current filename in context
    if (uploadedFile?.name) {
      setCurrentFileName(uploadedFile.name)
    }

    // Persist to S3 via API
    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Resume data confirmed and saved securely!")
          // Kick off coursework analysis but don't block navigation
          ; (async () => {
            try {
              toast.info("Analyzing your coursework...")
              const matchResponse = await fetch("/api/match-coursework?threshold=80")
              const matchData = await matchResponse.json()
              if (matchData.success) {
                toast.success("Coursework analysis complete!")
              } else {
                toast.warning("Course matching completed with warnings")
              }
            } catch (matchError) {
              console.error("Error matching coursework:", matchError)
              // Non-blocking warning; dashboard will still work
            }
          })()
        router.push("/questionnaire")
      } else {
        toast.warning("Resume data saved locally, but cloud save failed")
      }
    } catch (error) {
      console.error("Error saving resume:", error)
      toast.warning("Resume data saved locally only")
    }

    setShowVerification(false)
  }

  const handleVerificationCancel = () => {
    setShowVerification(false)
    toast.info("Verification cancelled")
  }

  const handleEditResume = () => {
    if (parseResult?.details) {
      setShowVerification(true)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <SignedOut>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to continue</CardTitle>
            <CardDescription>
              Please sign in with Clerk to upload your resume and unlock the job preferences workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SignInButton mode="modal">
              <Button size="lg">Sign in to get started</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        <div className="space-y-6 relative">

          {/* Main Upload Area - Blur when uploaded */}
          <Card className={cn(
            "transition-all duration-500",
            uploadedFile ? "opacity-20 blur-sm pointer-events-none" : "opacity-100"
          )}>
            <CardHeader>
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>
                Upload your resume to kick off the process. Supported formats: PDF, DOC, DOCX, TXT (Max 10MB). Once confirmed,
                you&apos;ll be routed directly to job preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50",
                  isDragActive ? "border-primary bg-primary/5" : "border-border",
                  isUploading ? "pointer-events-none opacity-50" : "",
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  {isDragActive ? (
                    <p className="text-lg font-medium">Drop your resume here...</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        {isUploading ? "Uploading..." : "Click or drag file to upload"}
                      </p>
                      <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, TXT up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modern Overlay when File is Uploaded */}
          {uploadedFile && !showVerification && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
              <div className="w-full max-w-md bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-8 flex flex-col items-center text-center space-y-6">

                {/* File Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                  <FileText className="h-16 w-16 text-blue-500 relative z-10" />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-background z-20">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>

                {/* Title & Info */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                    Resume Uploaded
                  </h3>
                  <div className="text-muted-foreground text-sm">
                    <p className="font-medium text-foreground">{uploadedFile.name}</p>
                    <p>{formatFileSize(uploadedFile.size)}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 w-full pt-2">
                  {/* Parse Button with slide animation */}
                  <button
                    onClick={parseResume}
                    disabled={isParsing}
                    className="group relative w-full overflow-hidden rounded-xl bg-primary p-4 text-primary-foreground font-semibold shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isParsing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          Parse Resume
                          <Rocket className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </span>
                  </button>

                  <Button
                    variant="ghost"
                    onClick={removeFile}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>

              </div>
            </div>
          )}

          {/* Verification Modal (already customized) */}
          {showVerification && parseResult?.details && (
            <ResumeVerification
              parsedData={parseResult.details}
              onConfirm={handleVerificationConfirm}
              onCancel={handleVerificationCancel}
              open={showVerification}
            />
          )}

        </div>
      </SignedIn>
    </div>
  )
}
