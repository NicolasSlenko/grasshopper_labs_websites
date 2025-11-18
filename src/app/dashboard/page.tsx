"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  TrendingUp, Target, Check, Github, Linkedin, Globe, Briefcase, Award, Users, X,
  GraduationCap, FolderKanban, Building2, Code, Database, Cloud, Cpu, Star
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CareerPathCourseworkChart } from "@/components/career-path-radar"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useResume } from "@/contexts/resume-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { QuestionnaireData } from "@/app/questionnaire/data"

// Mock data - replace with actual resume data later
const mockStudentData = {
  gpa: 3.7,
  yearInSchool: 3,
  internshipCount: 1,
  projectCount: 4,
  skills: {
    programmingLanguages: ["JavaScript", "Python", "TypeScript", "Java"],
    frameworks: ["React", "Next.js", "Node  .js", "Express"],
    databases: ["PostgreSQL", "MongoDB"],
    devops: ["Docker", "Git"],
    certifications: [] as string[],
  },
  resume: {
    hasGithub: true,
    hasLinkedIn: true,
    hasPortfolio: false,
    hasProjects: true,
    hasExperience: true,
    hasCertifications: false,
    hasExtracurriculars: true,
  },
}

const INTERNSHIP_AVG_GPA = 3.6

// Helper function to calculate year in school from start and end dates
function calculateYearInSchool(endDate?: string, startDate?: string): number {
  if (!endDate) return 1
  
  const gradDate = new Date(endDate)
  const now = new Date()
  
  // If they've already graduated
  if (gradDate < now) return 4
  
  // Calculate based on start date if available
  if (startDate) {
    const startDateObj = new Date(startDate)
    
    // Calculate how many months have passed since starting
    const monthsSinceStart = (now.getFullYear() - startDateObj.getFullYear()) * 12 + 
                            (now.getMonth() - startDateObj.getMonth())
    
    // Determine year based on months (assuming typical 4-year program)
    if (monthsSinceStart < 12) return 1      // Freshman (0-12 months)
    if (monthsSinceStart < 24) return 2      // Sophomore (12-24 months)
    if (monthsSinceStart < 36) return 3      // Junior (24-36 months)
    return 4                                  // Senior (36+ months)
  }
  
  // Fallback: calculate from graduation date
  const yearsUntilGrad = gradDate.getFullYear() - now.getFullYear()
  
  if (yearsUntilGrad <= 0) return 4           // Graduating this year or graduated
  if (yearsUntilGrad === 1) return 3          // Junior
  if (yearsUntilGrad === 2) return 2          // Sophomore
  return 1                                     // Freshman
}

// GPA Component
function GPAProgressBar({ gpa }: { gpa: number }) {
  const getGPAZone = (gpa: number) => {
    if (gpa < 3.0) return { color: "bg-red-500", label: "Needs Improvement", textColor: "text-red-700" }
    if (gpa < 3.4) return { color: "bg-orange-500", label: "Fair", textColor: "text-orange-700" }
    if (gpa < 3.7) return { color: "bg-yellow-500", label: "Good", textColor: "text-yellow-700" }
    if (gpa < 3.8) return { color: "bg-green-400", label: "Very Good", textColor: "text-green-600" }
    return { color: "bg-green-600", label: "Excellent", textColor: "text-green-700" }
  }

  const MIN_GPA = 2.5
  const MAX_GPA = 4.0
  const range = MAX_GPA - MIN_GPA

  const percentage = ((gpa - MIN_GPA) / range) * 100
  const benchmarkPercentage = ((INTERNSHIP_AVG_GPA - MIN_GPA) / range) * 100

  const zoneWidths = {
    red: ((3.0 - 2.5) / range) * 100,
    orange: ((3.4 - 3.0) / range) * 100,
    yellow: ((3.7 - 3.4) / range) * 100,
    lightGreen: ((3.8 - 3.7) / range) * 100,
    darkGreen: ((4.0 - 3.8) / range) * 100,
  }

  const zone = getGPAZone(gpa)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>GPA Analysis</CardTitle>
            <CardDescription>Your academic standing and competitiveness</CardDescription>
          </div>
          <Badge variant="outline" className={zone.textColor}>
            {zone.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your GPA</p>
            <p className="text-4xl font-bold">{gpa.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Out of</p>
            <p className="text-2xl font-semibold text-muted-foreground">4.0</p>
          </div>
        </div>

        <div className="space-y-2 py-4">
          <div className="relative w-full" style={{ paddingTop: '45px', paddingBottom: '60px' }}>
            <div
              className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-20"
              style={{ left: `${Math.max(0, Math.min(100, percentage))}%` }}
            >
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg whitespace-nowrap">
                You: {gpa.toFixed(2)}
              </div>
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary" />
            </div>

            <div className="relative h-8 w-full rounded-full overflow-hidden bg-muted" style={{ marginTop: '37px' }}>
              <div className="absolute inset-0 flex">
                <div className="bg-red-500" style={{ width: `${zoneWidths.red}%` }} />
                <div className="bg-orange-500" style={{ width: `${zoneWidths.orange}%` }} />
                <div className="bg-yellow-500" style={{ width: `${zoneWidths.yellow}%` }} />
                <div className="bg-green-400" style={{ width: `${zoneWidths.lightGreen}%` }} />
                <div className="bg-green-600" style={{ width: `${zoneWidths.darkGreen}%` }} />
              </div>

              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
                style={{ left: `${Math.max(0, Math.min(100, percentage))}%` }}
              />

              <div
                className="absolute top-0 bottom-0 w-1 bg-blue-600 z-10 shadow-md"
                style={{ left: `${benchmarkPercentage}%` }}
              />
            </div>

            <div
              className="absolute bottom-0 flex flex-col items-center -translate-x-1/2 z-20"
              style={{ left: `${benchmarkPercentage}%` }}
            >
              <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-600" />
              <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                <Target className="h-4 w-4" />
                Avg Internship: {INTERNSHIP_AVG_GPA.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="relative w-full pt-10 pb-2">
            <div className="relative text-xs text-muted-foreground">
              {[2.5, 3.0, 3.4, 3.7, 3.8, 4.0].map((value) => {
                const position = ((value - MIN_GPA) / range) * 100
                return (
                  <div
                    key={value}
                    className="absolute flex flex-col items-center -translate-x-1/2"
                    style={{ left: `${position}%` }}
                  >
                    <div className="h-2 w-px bg-border mb-1" />
                    <span className="font-medium">{value.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-4">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-red-500" />
              <span>2.5-3.0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-orange-500" />
              <span>3.0-3.4</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-yellow-500" />
              <span>3.4-3.7</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-green-400" />
              <span>3.7-3.8</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-green-600" />
              <span>3.8-4.0</span>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm">
            {gpa >= INTERNSHIP_AVG_GPA ? (
              <>
                <span className="font-semibold text-green-600">Great position!</span> Your GPA is{" "}
                {gpa > INTERNSHIP_AVG_GPA ? "above" : "at"} the average for students who secured
                internships ({INTERNSHIP_AVG_GPA.toFixed(1)}). Keep up the excellent work!
              </>
            ) : (
              <>
                <span className="font-semibold text-blue-600">Room for growth.</span> The average GPA for
                students who got internships is {INTERNSHIP_AVG_GPA.toFixed(1)}. Focus on your technical
                projects and experience to strengthen your profile!
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Year in School Component
function YearInSchoolIndicator({ currentYear }: { currentYear: number }) {
  const years = [
    { year: 1, label: "Freshman", title: "Build Your Foundation", description: "Focus on fundamentals, join clubs, start building portfolio", color: "from-blue-500 to-blue-600" },
    { year: 2, label: "Sophomore", title: "Gain Experience", description: "Seek first internship, develop technical projects, attend career fairs", color: "from-purple-500 to-purple-600" },
    { year: 3, label: "Junior", title: "Level Up", description: "Target competitive internships, strengthen resume, network actively", color: "from-orange-500 to-orange-600" },
    { year: 4, label: "Senior", title: "Launch Your Career", description: "Apply for full-time roles, leverage experience, finalize portfolio", color: "from-green-500 to-green-600" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Progress</CardTitle>
        <CardDescription>Your current year and recommended focus areas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-muted" />
          <div
            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-primary to-primary transition-all duration-500"
            style={{ width: `${((currentYear - 1) / 3) * 100}%` }}
          />

          <div className="relative grid grid-cols-4 gap-4">
            {years.map((yearData) => {
              const isActive = yearData.year === currentYear
              const isCompleted = yearData.year < currentYear
              const isFuture = yearData.year > currentYear

              return (
                <div key={yearData.year} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-4",
                      isActive && "bg-primary text-primary-foreground border-primary scale-110 shadow-lg",
                      isCompleted && "bg-green-500 text-white border-green-500",
                      isFuture && "bg-muted text-muted-foreground border-muted",
                    )}
                  >
                    {isCompleted ? <Check className="h-6 w-6" /> : yearData.year}
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-sm font-semibold",
                      isActive && "text-primary",
                      isCompleted && "text-green-600",
                      isFuture && "text-muted-foreground",
                    )}
                  >
                    {yearData.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8">
          {years.map((yearData) => {
            if (yearData.year === currentYear) {
              return (
                <div
                  key={yearData.year}
                  className={cn(
                    "p-6 rounded-lg bg-gradient-to-br text-white shadow-lg",
                    yearData.color,
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold">{yearData.title}</h3>
                    <Badge className="bg-white/20 text-white border-white/30">
                      Year {yearData.year}
                    </Badge>
                  </div>
                  <p className="text-white/90 text-lg">{yearData.description}</p>
                </div>
              )
            }
            return null
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Skills Radar Chart
function SkillsRadarChart({ skills }: { skills: typeof mockStudentData.skills }) {
  const radarData = [
    { category: "Languages", count: skills.programmingLanguages.length, fullMark: 8 },
    { category: "Frameworks", count: skills.frameworks.length, fullMark: 8 },
    { category: "Databases", count: skills.databases.length, fullMark: 5 },
    { category: "DevOps", count: skills.devops.length, fullMark: 5 },
    { category: "Certifications", count: skills.certifications.length, fullMark: 5 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills Portfolio</CardTitle>
        <CardDescription>Your skill depth across categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
              <Radar
                name="Your Skills"
                dataKey="count"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 border rounded-lg">
            <Code className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{skills.programmingLanguages.length}</p>
            <p className="text-sm text-muted-foreground">Languages</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Cpu className="h-5 w-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{skills.frameworks.length}</p>
            <p className="text-sm text-muted-foreground">Frameworks</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Database className="h-5 w-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{skills.databases.length}</p>
            <p className="text-sm text-muted-foreground">Databases</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Cloud className="h-5 w-5 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{skills.devops.length}</p>
            <p className="text-sm text-muted-foreground">DevOps</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Award className="h-5 w-5 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{skills.certifications.length}</p>
            <p className="text-sm text-muted-foreground">Certifications</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Technology Stack Alignment
function TechStackAlignment() {
  const stackData = [
    { sector: "Full Stack Dev", match: 8, total: 12, percentage: 67 },
    { sector: "Frontend Dev", match: 10, total: 12, percentage: 83 },
    { sector: "AI/ML", match: 3, total: 10, percentage: 30 },
    { sector: "Cloud Computing", match: 2, total: 10, percentage: 20 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technology Stack Alignment</CardTitle>
        <CardDescription>Match between your skills and target tech sectors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {stackData.map((stack) => (
          <div key={stack.sector} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{stack.sector}</p>
                <p className="text-sm text-muted-foreground">
                  {stack.match}/{stack.total} relevant skills ({stack.percentage}%)
                </p>
              </div>
              <Badge
                variant={stack.percentage >= 70 ? "default" : stack.percentage >= 50 ? "secondary" : "outline"}
              >
                {stack.percentage}%
              </Badge>
            </div>
            <div className="relative h-3 w-full rounded-full overflow-hidden bg-muted">
              <div
                className={cn(
                  "h-full transition-all",
                  stack.percentage >= 70 ? "bg-green-500" : stack.percentage >= 50 ? "bg-yellow-500" : "bg-orange-500"
                )}
                style={{ width: `${stack.percentage}%` }}
              />
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Top Skills to Learn:</h4>
          <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <li>• AWS/Azure basics (for Cloud Computing)</li>
            <li>• TensorFlow or PyTorch (for AI/ML)</li>
            <li>• Docker & Kubernetes (for DevOps)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

const mockProjects: Project[] = [
  { name: "Portfolio Website", category: "Web", completedAt: "2025-09-10", teamSize: 1 },
  { name: "VR Game", category: "XR", completedAt: "2025-06-22", teamSize: 3 },
  { name: "Mobile App", category: "Mobile", completedAt: "2025-08-01", teamSize: 2 },
  { name: "Data Analysis Tool", category: "Data", completedAt: "2025-07-15", teamSize: 1 },
  { name: "E-commerce Platform", category: "Web", completedAt: "2025-05-10", teamSize: 4 },
]

interface Project {
  name: string
  category: "Web" | "Mobile" | "XR" | "Data" | "Other"
  completedAt: string // ISO date string
  teamSize?: number
}

function ProjectPortfolioSummary({ projects }: { projects: Project[] }) {
  const projectCount = projects.length

  const categoryCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {})

  const getProjectStatus = (count: number) => {
    if (count <= 1) return { 
      status: "Build More", 
      message: "You only have a few projects. Focus on building diverse hands-on experience!", 
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-900"
    }
    if (count <= 3) return { 
      status: "Good Portfolio", 
      message: "Good start! Add a few more projects in different categories to strengthen your portfolio.", 
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900"
    }
    return { 
      status: "Impressive!", 
      message: "Impressive portfolio! Shows solid experience across multiple domains.", 
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-900"
    }
  }

  const status = getProjectStatus(projectCount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Portfolio</CardTitle>
        <CardDescription>Insights into your projects and skill coverage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Projects */}
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl font-bold">{projectCount}</p>
            <p className="text-muted-foreground">Total Projects</p>
          </div>
        </div>

        {/* Status */}
        <div className={cn("p-4 rounded-lg border", status.bgColor, status.borderColor)}>
          <div className="flex items-start gap-3">
            <Star className={cn("h-5 w-5 mt-0.5", status.color)} />
            <div>
              <h4 className={cn("font-semibold", status.color)}>{status.status}</h4>
              <p className="text-sm text-muted-foreground mt-1">{status.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Categories: {Object.entries(categoryCounts).map(([cat, count]) => `${cat} (${count})`).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {projects.map((p, i) => (
            <div
              key={i}
              className="p-2 border rounded-lg flex flex-col bg-muted/5 dark:bg-muted/20"
            >
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                Category: {p.category} | Completed: {new Date(p.completedAt).toLocaleDateString()} | Team Size: {p.teamSize}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ResumeCompletenessScore({ resume }: { resume: typeof mockStudentData.resume }) {
  const criteria = [
    { label: "GitHub Profile", icon: Github, value: resume.hasGithub, points: 15 },
    { label: "LinkedIn Profile", icon: Linkedin, value: resume.hasLinkedIn, points: 10 },
    { label: "Portfolio Website", icon: Globe, value: resume.hasPortfolio, points: 15 },
    { label: "Projects", icon: Briefcase, value: resume.hasProjects, points: 20 },
    { label: "Work Experience", icon: Briefcase, value: resume.hasExperience, points: 20 },
    { label: "Certifications", icon: Award, value: resume.hasCertifications, points: 10 },
    { label: "Extracurriculars", icon: Users, value: resume.hasExtracurriculars, points: 10 },
  ]

  const totalScore = criteria.reduce((sum, item) => sum + (item.value ? item.points : 0), 0)
  const percentage = totalScore

  const getStatusInfo = (score: number) => {
    if (score >= 90) return { color: "text-green-600", bg: "bg-green-600", label: "Excellent" }
    if (score >= 75) return { color: "text-blue-600", bg: "bg-blue-600", label: "Very Good" }
    if (score >= 60) return { color: "text-yellow-600", bg: "bg-yellow-600", label: "Good" }
    if (score >= 40) return { color: "text-orange-600", bg: "bg-orange-600", label: "Fair" }
    return { color: "text-red-600", bg: "bg-red-600", label: "Needs Work" }
  }

  const status = getStatusInfo(totalScore)
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resume Completeness</CardTitle>
            <CardDescription>How complete is your profile?</CardDescription>
          </div>
          <Badge variant="outline" className={status.color}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="70" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted" />
                <circle
                  cx="96" cy="96" r="70" stroke="currentColor" strokeWidth="12" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                  className={cn("transition-all duration-1000 ease-out", status.bg)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold">{totalScore}%</span>
                <span className="text-sm text-muted-foreground">Complete</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {criteria.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                    item.value ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-border bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        item.value ? "bg-green-500 text-white" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.value ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </div>
                    <span className={cn("font-medium text-sm", item.value ? "text-foreground" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                  </div>
                  <Badge variant={item.value ? "default" : "secondary"} className="font-semibold">
                    +{item.points}%
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const mockInternships: Internship[] = [
  {
    company: "Apple",
    role: "Hardware Engineering Intern",
    startDate: "2025-06-01",
    endDate: "2025-08-15",
    description: "Worked on testing electrical sub-systems for XR products."
  },
  {
    company: "Google",
    role: "Software Engineering Intern",
    startDate: "2024-06-01",
    endDate: "2024-08-15",
    description: "Implemented a dashboard for analytics tools using React."
  },
]

interface Internship {
  company: string
  role: string
  startDate: string // ISO string
  endDate?: string
  description?: string
}

function InternshipSummary({ internships }: { internships: Internship[] }) {
  const internshipCount = internships.length

  const getInternshipStatus = (count: number) => {
    if (count === 0) return {
      message: "No worries! Everyone starts somewhere. We'll help you land your first opportunity!",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
      icon: Briefcase
    }
    if (count === 1) return {
      message: "Great start! Previous experience makes future opportunities easier to secure.",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900",
      icon: Briefcase
    }
    return {
      message: "Excellent position! You're highly competitive for top roles.",
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-900",
      icon: Star
    }
  }

  const status = getInternshipStatus(internshipCount)
  const Icon = status.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internship Experience</CardTitle>
        <CardDescription>Insights into your previous internships</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total internships */}
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl font-bold">{internshipCount}</p>
            <p className="text-muted-foreground">
              {internshipCount === 1 ? "Internship" : "Internships"}
            </p>
          </div>
        </div>

        {/* Status box */}
        <div className={cn("p-4 rounded-lg border", status.bgColor, status.borderColor)}>
          <p className={cn("text-sm font-medium", status.color)}>{status.message}</p>
        </div>

        {/* Internship list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {internships.map((i, idx) => (
            <div
              key={idx}
              className="p-2 border rounded-lg flex flex-col bg-muted/5 dark:bg-muted/20"
            >
              <p className="font-semibold">{i.role} @ {i.company}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(i.startDate).toLocaleDateString()} 
                {i.endDate ? ` - ${new Date(i.endDate).toLocaleDateString()}` : " - Present"}
              </p>
              {i.description && (
                <p className="text-xs text-muted-foreground mt-1">{i.description}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


function JobPreferencesSummary({ preferences }: { preferences: QuestionnaireData }) {
  const sections = [
    { label: "Tech Sectors", values: preferences.techSectors },
    { label: "Role Types", values: preferences.roleTypes },
    { label: "Preferred Locations", values: preferences.location },
    { label: "Work Environment", values: preferences.workEnvironment },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Preferences Snapshot</CardTitle>
        <CardDescription>Highlights from your latest questionnaire</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{section.label}</p>
            {section.values.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {section.values.slice(0, 6).map((value) => (
                  <Badge key={`${section.label}-${value}`} variant="secondary">
                    {value}
                  </Badge>
                ))}
                {section.values.length > 6 && (
                  <span className="text-xs text-muted-foreground">
                    +{section.values.length - 6} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No selections yet</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RoleSkillsMatch() {
  const roleData = [
    { role: "Full Stack Dev", match: 70, skills: "7/10 skills", color: "#10b981" },
    { role: "Frontend Dev", match: 85, skills: "9/10 skills", color: "#3b82f6" },
    { role: "Backend Dev", match: 60, skills: "6/10 skills", color: "#f59e0b" },
  ]

  const COLORS = roleData.map(r => r.color)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role-Relevant Skills Match</CardTitle>
        <CardDescription>Based on your target roles from the questionnaire</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="match"
                  label={(entry) => `${entry.match}%`}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {roleData.map((role, index) => (
              <div key={role.role} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="font-semibold">{role.role}</span>
                  </div>
                  <Badge>{role.match}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground pl-5">{role.skills}</p>
                <div className="relative h-2 w-full rounded-full overflow-hidden bg-muted pl-5">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${role.match}%`, backgroundColor: COLORS[index] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overall")
  const { resumeData, isLoading } = useResume()

  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/preferences")
        if (!response.ok) {
          if (response.status === 401 && isMounted) {
            setQuestionnaireData(null)
          }
          return
        }
        const result = await response.json()
        if (isMounted) {
          setQuestionnaireData(result.data ?? null)
        }
      } catch (error) {
        console.error("Error loading questionnaire preferences:", error)
      }
    }
    loadPreferences()
    return () => {
      isMounted = false
    }
  }, [])

  // Extract data from resume or use mock data
  const studentData = resumeData ? {
    gpa: resumeData.education?.[0]?.gpa || 0,
    yearInSchool: calculateYearInSchool(
      resumeData.education?.[0]?.end_date,
      resumeData.education?.[0]?.start_date
    ),
    internshipCount: resumeData.experience?.filter(exp => 
      exp.position.toLowerCase().includes('intern')
    ).length || 0,
    projectCount: resumeData.projects?.length || 0,
    skills: {
      programmingLanguages: resumeData.skills?.programming_languages || [],
      frameworks: resumeData.skills?.frameworks || [],
      databases: resumeData.skills?.databases || [],
      devops: resumeData.skills?.devops_tools || [],
      certifications: resumeData.certifications?.map(cert => cert.name) || [],
    },
    resume: {
      hasGithub: !!resumeData.basics?.github,
      hasLinkedIn: !!resumeData.basics?.linkedin,
      hasPortfolio: !!resumeData.basics?.portfolio,
      hasProjects: (resumeData.projects?.length || 0) > 0,
      hasExperience: (resumeData.experience?.length || 0) > 0,
      hasCertifications: (resumeData.certifications?.length || 0) > 0,
      hasExtracurriculars: (resumeData.extracurriculars?.length || 0) > 0,
    },
  } : mockStudentData

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Your personalized insights and recommendations</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-muted-foreground">Loading your resume data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show message if no resume data
  if (!resumeData) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Your personalized insights and recommendations</p>
          </div>

          <Alert className="mb-6">
            <AlertTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              No Resume Data Found
            </AlertTitle>
            <AlertDescription>
              <p className="mb-4">Upload and verify your resume to see your personalized dashboard with real data.</p>
              <Button asChild>
                <Link href="/">Upload Resume</Link>
              </Button>
            </AlertDescription>
          </Alert>

          <div className="text-muted-foreground">
            <p>Using mock data for demonstration purposes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Your personalized insights and recommendations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mx-auto">
            <TabsTrigger value="overall" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Education
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Experience
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-6">
            {questionnaireData && <JobPreferencesSummary preferences={questionnaireData} />}
            <Accordion type="multiple" className="space-y-4" defaultValue={["coursework", "skills-overview", "tech-overview", "resume-overview"]}>
              <AccordionItem value="coursework" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Career Path Coursework (Radar)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CareerPathCourseworkChart />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="skills-overview" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Skills Portfolio (Spider Web)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <SkillsRadarChart skills={studentData.skills} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tech-overview" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Technology Stack Alignment</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <TechStackAlignment />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="resume-overview" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Resume Completeness</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ResumeCompletenessScore resume={studentData.resume} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="education" className="space-y-6">
            <Accordion type="multiple" className="space-y-4" defaultValue={["gpa", "year", "skills", "tech", "coursework"]}>
              <AccordionItem value="gpa" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-semibold">GPA Analysis</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <GPAProgressBar gpa={studentData.gpa} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="year" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Academic Progress</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <YearInSchoolIndicator currentYear={studentData.yearInSchool} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="skills" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Skills Portfolio (Spider Web)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <SkillsRadarChart skills={studentData.skills} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tech" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Technology Stack Alignment</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <TechStackAlignment />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Accordion type="multiple" className="space-y-4" defaultValue={["portfolio", "resume"]}>
              <AccordionItem value="portfolio" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Project Portfolio</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ProjectPortfolioSummary projects={mockProjects} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="resume" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Resume Completeness</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ResumeCompletenessScore resume={studentData.resume} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            <Accordion type="multiple" className="space-y-4" defaultValue={["internships", "roles"]}>
              <AccordionItem value="internships" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Internship Experience</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <InternshipSummary internships={mockInternships} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="roles" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Role-Relevant Skills Match</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <RoleSkillsMatch />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
