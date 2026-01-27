"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, AlertCircle, X, Rocket, Loader2, FileUp, Edit } from "lucide-react"
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
  const { setResumeData } = useResume()
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
  }

  const handleVerificationConfirm = async (data: Resume) => {
    setVerifiedData(data)
    setResumeData(data) // Save to global context

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
        ;(async () => {
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

  const renderParseResult = (result: ParseResult) => {
    if (!result.details) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">Failed to parse resume</p>
        </div>
      )
    }

    const data = result.details
    return (
      <div className="space-y-6">
        {data.basics && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg border-b pb-2">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>Name:</strong> {data.basics.name || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {data.basics.email || "N/A"}
                </p>
                <p>
                  <strong>Phone:</strong> {data.basics.phone || "N/A"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Location:</strong>{" "}
                  {data.basics.location
                    ? `${data.basics.location.city}, ${data.basics.location.state}, ${data.basics.location.country}`
                    : "N/A"}
                </p>
                <p>
                  <strong>LinkedIn:</strong> {data.basics.linkedin || "N/A"}
                </p>
                <p>
                  <strong>GitHub:</strong> {data.basics.github || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {data.education && data.education.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg border-b pb-2">Education</h4>
            {data.education.map((edu, idx: number) => (
              <div key={idx} className="bg-muted/30 p-3 rounded-lg">
                <p className="font-medium">
                  {edu.degree} in {edu.field}
                </p>
                <p className="text-sm text-muted-foreground">{edu.school}</p>
                <p className="text-sm">
                  {edu.start_date} - {edu.end_date}
                </p>
                {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
              </div>
            ))}
          </div>
        )}

        {data.skills && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg border-b pb-2">Skills</h4>
            <div className="space-y-3">
              {Object.entries(data.skills).map(
                ([category, skills]) =>
                  Array.isArray(skills) &&
                  skills.length > 0 && (
                    <div key={category}>
                      <p className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                        {category.replace(/_/g, " ")}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>
        )}

        {data.experience && data.experience.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg border-b pb-2">Experience</h4>
            {data.experience.map((exp, idx: number) => (
              <div key={idx} className="bg-muted/30 p-3 rounded-lg space-y-2">
                <div>
                  <p className="font-medium">{exp.position}</p>
                  <p className="text-sm text-muted-foreground">
                    {exp.company} • {exp.location}
                  </p>
                  <p className="text-sm">
                    {exp.start_date} - {exp.end_date}
                  </p>
                </div>
                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Responsibilities:</p>
                    <ul className="text-xs list-disc list-inside space-y-1">
                      {exp.responsibilities.map((resp: string, i: number) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {exp.technologies.map((tech: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {data.projects && data.projects.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg border-b pb-2">Projects</h4>
            {data.projects.map((project, idx: number) => (
              <div key={idx} className="bg-muted/30 p-3 rounded-lg space-y-2">
                <p className="font-medium">{project.name}</p>
                <p className="text-sm">{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.map((tech: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {data.achievements && data.achievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg border-b pb-2">Achievements</h4>
            {data.achievements.map((achievement, idx: number) => (
              <div key={idx} className="bg-muted/30 p-3 rounded-lg">
                <p className="font-medium">{achievement.title}</p>
                <p className="text-sm text-muted-foreground">
                  {achievement.issuer} • {achievement.date}
                </p>
                <p className="text-sm">{achievement.description}</p>
              </div>
            ))}
          </div>
        )}

        {result.missing && result.missing.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg border-b pb-2 text-orange-600">Missing Information</h4>
            <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
              {result.missing.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
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
        <div className="space-y-6">
      <Card>
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
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              isUploading && "pointer-events-none opacity-50",
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg font-medium">Drop your resume here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {isUploading ? "Uploading..." : "Drop your resume here, or click to select"}
                  </p>
                  <p className="text-sm text-muted-foreground">PDF, DOC, DOCX, TXT up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {uploadStatus === "success" && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-200">File uploaded successfully!</span>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200">{errorMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadedFile && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded File & Parsing</CardTitle>
            <CardDescription>Your uploaded resume file with AI-powered parsing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.size)} • Uploaded{" "}
                      {new Date(uploadedFile.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {!parseResult ? (
                  <div className="flex gap-4 flex-wrap">
                    <Button 
                      onClick={parseResume} 
                      disabled={isParsing} 
                      variant="default" 
                      size="sm"
                    >
                      {isParsing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Rocket className="h-4 w-4 mr-2" />
                      )}
                      Parse Resume
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-wrap w-full">
                    <div className="flex items-center gap-4 flex-wrap">
                      <Button variant="secondary" size="sm" onClick={handleEditResume}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm">
                            <FileUp className="h-4 w-4 mr-2" />
                            Export as
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="hover:cursor-pointer">
                          <DropdownMenuItem onClick={() => exportJSON("download")} className="hover:cursor-pointer">File</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportJSON("clipboard")} className="hover:cursor-pointer">Clipboard</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}

                {parseResult && (
                  <div className="mt-4">
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h3 className="font-semibold mb-3 flex items-center">
                        <Rocket className="h-4 w-4 mr-2" />
                        Parsing Results
                      </h3>
                      {renderParseResult({
                        details: verifiedData || parseResult.details,
                        missing: parseResult.missing
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Confirm your resume details to be redirected automatically to the job preferences questionnaire.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

