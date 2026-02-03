"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  TrendingUp, Target, Check, Github, Linkedin, Globe, Briefcase, Award, Users, X,
  GraduationCap, FolderKanban, Building2, Code, Database, Cloud, Cpu, Star, FileText
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

        <div className="space-y-2 py-4 px-10">
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

          <div className="relative w-full pt-2 pb-2">
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

// Role-based skill suggestions for empty sections
const roleSkillSuggestions: Record<string, {
  programmingLanguages: string[]
  frameworks: string[]
  databases: string[]
  devops: string[]
  certifications: string[]
}> = {
  "Frontend Developer": {
    programmingLanguages: ["JavaScript", "TypeScript", "HTML", "CSS"],
    frameworks: ["React", "Vue.js", "Angular", "Next.js", "Tailwind CSS"],
    databases: ["Firebase", "IndexedDB"],
    devops: ["Webpack", "Vite", "npm", "Git"],
    certifications: ["Meta Front-End Developer", "AWS Certified Cloud Practitioner"],
  },
  "Backend Developer": {
    programmingLanguages: ["Python", "Java", "Go", "Node.js", "C#"],
    frameworks: ["Express.js", "Django", "Spring Boot", "FastAPI", ".NET"],
    databases: ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
    devops: ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux"],
    certifications: ["AWS Solutions Architect", "Oracle Java Certification"],
  },
  "Full Stack Developer": {
    programmingLanguages: ["JavaScript", "TypeScript", "Python", "SQL"],
    frameworks: ["React", "Next.js", "Node.js", "Express", "Django"],
    databases: ["PostgreSQL", "MongoDB", "Redis"],
    devops: ["Docker", "Git", "AWS", "Vercel"],
    certifications: ["AWS Developer Associate", "MongoDB Developer"],
  },
  "Mobile Developer": {
    programmingLanguages: ["Swift", "Kotlin", "Dart", "JavaScript", "TypeScript"],
    frameworks: ["React Native", "Flutter", "SwiftUI", "Jetpack Compose"],
    databases: ["SQLite", "Realm", "Firebase"],
    devops: ["Xcode", "Android Studio", "Fastlane", "Git"],
    certifications: ["Google Associate Android Developer", "Apple Developer Certification"],
  },
  "DevOps Engineer": {
    programmingLanguages: ["Python", "Bash", "Go", "YAML"],
    frameworks: ["Terraform", "Ansible", "Helm"],
    databases: ["PostgreSQL", "Redis", "Elasticsearch"],
    devops: ["Docker", "Kubernetes", "Jenkins", "AWS", "Azure", "GCP", "Prometheus", "Grafana"],
    certifications: ["AWS DevOps Engineer", "Kubernetes Administrator (CKA)", "HashiCorp Terraform"],
  },
  "Data Engineer": {
    programmingLanguages: ["Python", "SQL", "Scala", "Java"],
    frameworks: ["Apache Spark", "Airflow", "dbt", "Kafka"],
    databases: ["PostgreSQL", "Snowflake", "BigQuery", "Redshift", "Delta Lake"],
    devops: ["Docker", "Kubernetes", "AWS", "GCP", "Terraform"],
    certifications: ["AWS Data Analytics", "Google Data Engineer", "Databricks Certified"],
  },
  "Data Scientist": {
    programmingLanguages: ["Python", "R", "SQL", "Julia"],
    frameworks: ["Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Jupyter"],
    databases: ["PostgreSQL", "BigQuery", "Snowflake"],
    devops: ["Git", "Docker", "MLflow", "AWS SageMaker"],
    certifications: ["AWS Machine Learning", "Google Data Analytics", "IBM Data Science"],
  },
  "Machine Learning Engineer": {
    programmingLanguages: ["Python", "C++", "Julia", "SQL"],
    frameworks: ["TensorFlow", "PyTorch", "Keras", "Hugging Face", "MLflow", "Kubeflow"],
    databases: ["PostgreSQL", "MongoDB", "Vector DBs (Pinecone, Weaviate)"],
    devops: ["Docker", "Kubernetes", "AWS SageMaker", "GCP Vertex AI"],
    certifications: ["AWS Machine Learning Specialty", "TensorFlow Developer", "Google ML Engineer"],
  },
  "Security Engineer": {
    programmingLanguages: ["Python", "Go", "C", "Bash", "PowerShell"],
    frameworks: ["OWASP", "Metasploit", "Burp Suite", "Nessus"],
    databases: ["PostgreSQL", "Elasticsearch", "Splunk"],
    devops: ["Docker", "Kubernetes", "Terraform", "AWS Security Hub"],
    certifications: ["CISSP", "CEH", "CompTIA Security+", "AWS Security Specialty"],
  },
  "QA / Test Engineer": {
    programmingLanguages: ["JavaScript", "Python", "Java", "TypeScript"],
    frameworks: ["Selenium", "Cypress", "Jest", "Playwright", "Appium"],
    databases: ["PostgreSQL", "MySQL", "MongoDB"],
    devops: ["Jenkins", "Git", "Docker", "CI/CD pipelines"],
    certifications: ["ISTQB Certified Tester", "AWS Certified Developer"],
  },
  "Product Manager": {
    programmingLanguages: ["SQL", "Python (basic)"],
    frameworks: ["Jira", "Figma", "Amplitude", "Mixpanel"],
    databases: ["BigQuery", "Looker"],
    devops: ["Git (basic)", "Confluence"],
    certifications: ["Certified Scrum Product Owner", "Google Analytics", "Product School Certification"],
  },
  "Engineering Manager": {
    programmingLanguages: ["Python", "JavaScript", "SQL"],
    frameworks: ["Agile/Scrum tools", "Jira", "Linear"],
    databases: ["PostgreSQL", "MongoDB"],
    devops: ["Git", "CI/CD concepts", "AWS/GCP basics"],
    certifications: ["PMP", "Certified Scrum Master", "AWS Solutions Architect"],
  },
  "Solutions Architect": {
    programmingLanguages: ["Python", "Java", "TypeScript", "SQL"],
    frameworks: ["AWS CDK", "Terraform", "Serverless Framework"],
    databases: ["PostgreSQL", "DynamoDB", "Redis", "Snowflake"],
    devops: ["Docker", "Kubernetes", "AWS", "Azure", "GCP"],
    certifications: ["AWS Solutions Architect Professional", "Azure Solutions Architect", "GCP Professional Architect"],
  },
  "UI/UX Designer": {
    programmingLanguages: ["HTML", "CSS", "JavaScript (basic)"],
    frameworks: ["Figma", "Sketch", "Adobe XD", "Framer"],
    databases: [],
    devops: ["Git", "Zeplin", "InVision"],
    certifications: ["Google UX Design", "Nielsen Norman UX Certification", "Interaction Design Foundation"],
  },
}

// Get suggestions based on role types
function getSuggestionsForRoles(roleTypes: string[]): {
  programmingLanguages: string[]
  frameworks: string[]
  databases: string[]
  devops: string[]
  certifications: string[]
} {
  const suggestions = {
    programmingLanguages: new Set<string>(),
    frameworks: new Set<string>(),
    databases: new Set<string>(),
    devops: new Set<string>(),
    certifications: new Set<string>(),
  }

  for (const role of roleTypes) {
    const roleSuggestions = roleSkillSuggestions[role]
    if (roleSuggestions) {
      roleSuggestions.programmingLanguages.forEach(s => suggestions.programmingLanguages.add(s))
      roleSuggestions.frameworks.forEach(s => suggestions.frameworks.add(s))
      roleSuggestions.databases.forEach(s => suggestions.databases.add(s))
      roleSuggestions.devops.forEach(s => suggestions.devops.add(s))
      roleSuggestions.certifications.forEach(s => suggestions.certifications.add(s))
    }
  }

  return {
    programmingLanguages: Array.from(suggestions.programmingLanguages).slice(0, 5),
    frameworks: Array.from(suggestions.frameworks).slice(0, 5),
    databases: Array.from(suggestions.databases).slice(0, 4),
    devops: Array.from(suggestions.devops).slice(0, 5),
    certifications: Array.from(suggestions.certifications).slice(0, 3),
  }
}

// Skills Radar Chart
function SkillsRadarChart({ 
  skills, 
  roleTypes = [] 
}: { 
  skills: typeof mockStudentData.skills
  roleTypes?: string[]
}) {
  const suggestions = getSuggestionsForRoles(roleTypes)
  const radarData = [
    { category: "Languages", count: skills.programmingLanguages.length, fullMark: 8 },
    { category: "Frameworks", count: skills.frameworks.length, fullMark: 8 },
    { category: "Databases", count: skills.databases.length, fullMark: 5 },
    { category: "DevOps", count: skills.devops.length, fullMark: 5 },
    { category: "Certifications", count: skills.certifications.length, fullMark: 5 },
  ]

  const SkillSection = ({ 
    title, 
    icon: Icon, 
    iconColor, 
    items, 
    suggestedItems 
  }: { 
    title: string
    icon: React.ElementType
    iconColor: string
    items: string[]
    suggestedItems: string[]
  }) => {
    const hasSuggestions = items.length === 0 && suggestedItems.length > 0
    
    return (
      <div className="p-4 border rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <span className="font-medium text-sm">{title}</span>
          </div>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {items.map((item, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        ) : hasSuggestions ? (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              Suggested for your target roles:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedItems.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-xs border-dashed border-yellow-500/50 text-muted-foreground">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-2">No skills listed</p>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills Portfolio</CardTitle>
        <CardDescription>Your extracted skills and recommendations based on target roles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 mb-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkillSection
            title="Programming Languages"
            icon={Code}
            iconColor="text-blue-500"
            items={skills.programmingLanguages}
            suggestedItems={suggestions.programmingLanguages}
          />
          <SkillSection
            title="Frameworks & Libraries"
            icon={Cpu}
            iconColor="text-purple-500"
            items={skills.frameworks}
            suggestedItems={suggestions.frameworks}
          />
          <SkillSection
            title="Databases"
            icon={Database}
            iconColor="text-green-500"
            items={skills.databases}
            suggestedItems={suggestions.databases}
          />
          <SkillSection
            title="DevOps & Cloud"
            icon={Cloud}
            iconColor="text-orange-500"
            items={skills.devops}
            suggestedItems={suggestions.devops}
          />
          <SkillSection
            title="Certifications"
            icon={Award}
            iconColor="text-yellow-500"
            items={skills.certifications}
            suggestedItems={suggestions.certifications}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Technology Stack Alignment - Hidden for now
// function TechStackAlignment() { ... }

interface Project {
  name: string
  description: string
  technologies: string[]
  highlights: string[]
  link: string
  github: string
}

// Map role types and tech sectors to project categories for relevance scoring
const roleToCategories: Record<string, string[]> = {
  "Frontend Developer": ["Web"],
  "Backend Developer": ["Web", "Data/ML"],
  "Full Stack Developer": ["Web", "Data/ML"],
  "Mobile Developer": ["Mobile"],
  "DevOps Engineer": ["Web", "Data/ML"],
  "Data Engineer": ["Data/ML"],
  "Data Scientist": ["Data/ML"],
  "Machine Learning Engineer": ["Data/ML"],
  "Security Engineer": ["Web", "Data/ML"],
  "QA / Test Engineer": ["Web", "Mobile"],
  "Product Manager": ["Web", "Mobile", "Data/ML"],
  "Engineering Manager": ["Web", "Mobile", "Data/ML"],
  "Solutions Architect": ["Web", "Data/ML"],
  "UI/UX Designer": ["Web", "Mobile"],
}

const sectorToCategories: Record<string, string[]> = {
  "Artificial Intelligence / Machine Learning": ["Data/ML"],
  "Cloud Computing": ["Web", "Data/ML"],
  "Cybersecurity": ["Web"],
  "Data Science / Analytics": ["Data/ML"],
  "DevOps / Infrastructure": ["Web"],
  "E-commerce": ["Web"],
  "FinTech": ["Web", "Data/ML"],
  "HealthTech": ["Web", "Mobile", "Data/ML"],
  "Mobile Development": ["Mobile"],
  "Web Development": ["Web"],
  "Gaming": ["XR", "Mobile"],
  "IoT (Internet of Things)": ["Other"],
  "Blockchain / Crypto": ["Web"],
  "EdTech": ["Web", "Mobile"],
}

function ProjectPortfolioSummary({ 
  projects, 
  roleTypes = [], 
  techSectors = [] 
}: { 
  projects: Project[]
  roleTypes?: string[]
  techSectors?: string[]
}) {
  const projectCount = projects.length

  // Categorize projects based on technologies
  const categorizeProject = (tech: string[]): string => {
    const techLower = tech.map(t => t.toLowerCase())
    if (techLower.some(t => t.includes('react native') || t.includes('flutter') || t.includes('swift') || t.includes('kotlin') || t.includes('ios') || t.includes('android'))) return 'Mobile'
    if (techLower.some(t => t.includes('unity') || t.includes('unreal') || t.includes('vr') || t.includes('ar') || t.includes('xr'))) return 'XR'
    if (techLower.some(t => t.includes('tensorflow') || t.includes('pytorch') || t.includes('pandas') || t.includes('sklearn') || t.includes('machine learning') || t.includes('data'))) return 'Data/ML'
    if (techLower.some(t => t.includes('react') || t.includes('vue') || t.includes('angular') || t.includes('next') || t.includes('node') || t.includes('html') || t.includes('css') || t.includes('javascript') || t.includes('typescript'))) return 'Web'
    return 'Other'
  }

  const categoryCounts = projects.reduce<Record<string, number>>((acc, p) => {
    const category = categorizeProject(p.technologies)
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {})

  // Get relevant categories based on user's role types and tech sectors
  const getRelevantCategories = (): Set<string> => {
    const relevant = new Set<string>()
    roleTypes.forEach(role => {
      roleToCategories[role]?.forEach(cat => relevant.add(cat))
    })
    techSectors.forEach(sector => {
      sectorToCategories[sector]?.forEach(cat => relevant.add(cat))
    })
    return relevant
  }

  const relevantCategories = getRelevantCategories()
  const categoryDiversity = Object.keys(categoryCounts).length
  
  // Count how many projects are in relevant categories
  const relevantProjectCount = projects.filter(p => 
    relevantCategories.has(categorizeProject(p.technologies))
  ).length

  // Calculate a score based on: count, diversity, and relevance
  const calculateScore = () => {
    let score = 0
    
    // Base score from project count (max 40 points)
    score += Math.min(projectCount * 10, 40)
    
    // Diversity bonus (max 20 points)
    score += Math.min(categoryDiversity * 10, 20)
    
    // Relevance bonus - projects matching target roles/sectors (max 40 points)
    if (relevantCategories.size > 0 && projectCount > 0) {
      const relevancePercent = relevantProjectCount / projectCount
      score += Math.round(relevancePercent * 40)
    } else {
      score += 20 // Default if no preferences set
    }
    
    return Math.min(score, 100)
  }

  const score = calculateScore()

  const getProjectStatus = () => {
    if (projectCount === 0) return { 
      status: "Get Started", 
      message: "Add projects to your resume to showcase your hands-on experience!",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900"
    }
    if (score < 40) return { 
      status: "Build More", 
      message: "Focus on building more projects, especially in areas related to your target roles.", 
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-900"
    }
    if (score < 70) return { 
      status: "Good Progress", 
      message: `Good foundation! ${relevantCategories.size > 0 && relevantProjectCount < projectCount ? "Consider adding more projects aligned with your target roles." : "Keep building diverse projects."}`, 
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-900"
    }
    return { 
      status: "Excellent!", 
      message: "Strong portfolio with good diversity and alignment to your career goals!", 
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-900"
    }
  }

  const status = getProjectStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Portfolio</CardTitle>
        <CardDescription>Insights into your projects and alignment with career goals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-4xl font-bold">{projectCount}</p>
            <p className="text-sm text-muted-foreground">Projects</p>
          </div>
          <div>
            <p className="text-4xl font-bold">{categoryDiversity}</p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary">{score}</p>
            <p className="text-sm text-muted-foreground">Score</p>
          </div>
        </div>

        {/* Status */}
        <div className={cn("p-4 rounded-lg border", status.bgColor, status.borderColor)}>
          <div className="flex items-start gap-3">
            <Star className={cn("h-5 w-5 mt-0.5", status.color)} />
            <div>
              <h4 className={cn("font-semibold", status.color)}>{status.status}</h4>
              <p className="text-sm text-muted-foreground mt-1">{status.message}</p>
              {projectCount > 0 && (
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p>Categories: {Object.entries(categoryCounts).map(([cat, count]) => `${cat} (${count})`).join(", ")}</p>
                  {relevantCategories.size > 0 && (
                    <p className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {relevantProjectCount} of {projectCount} projects align with your target roles
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No projects found in your resume</p>
              <p className="text-sm mt-1">Add projects to showcase your hands-on experience!</p>
            </div>
          ) : (
            projects.map((p, i) => (
              <div
                key={i}
                className="p-3 border rounded-lg bg-muted/5 dark:bg-muted/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                    )}
                  </div>
                </div>
                {p.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.technologies.slice(0, 6).map((tech, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {p.technologies.length > 6 && (
                      <Badge variant="secondary" className="text-xs">+{p.technologies.length - 6}</Badge>
                    )}
                  </div>
                )}
                {(p.github || p.link) && (
                  <div className="flex gap-3 text-xs">
                    {p.github && (
                      <a href={p.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Github className="h-3 w-3" /> GitHub
                      </a>
                    )}
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Globe className="h-3 w-3" /> Live Demo
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Overall Resume Score Component
interface ResumeScoreProps {
  gpa: number
  skills: typeof mockStudentData.skills
  resume: typeof mockStudentData.resume
  projects: Project[]
  internships: Experience[]
  courseworkCategories?: number // number of distinct CS categories
  roleTypes?: string[]
  techSectors?: string[]
}

function OverallResumeScore({ 
  gpa, 
  skills, 
  resume, 
  projects, 
  internships,
  courseworkCategories = 0,
  roleTypes = [],
  techSectors = []
}: ResumeScoreProps) {
  // Weights for each component (total = 100)
  const WEIGHTS = {
    coursework: 5,       // Small impact
    skills: 20,          // Somewhat important
    resumeCompleteness: 15, // Somewhat important
    gpa: 15,             // Decent
    projects: 25,        // Important
    internships: 20,     // Important
  }

  // 1. Coursework Score (0-100, then weighted)
  const courseworkScore = Math.min(courseworkCategories * 20, 100)

  // 2. Skills Portfolio Score (general coverage + count)
  const calculateSkillsScore = () => {
    const counts = {
      languages: skills.programmingLanguages.length,
      frameworks: skills.frameworks.length,
      databases: skills.databases.length,
      devops: skills.devops.length,
      certs: skills.certifications.length,
    }
    
    // Coverage: how many categories have at least 1 skill (max 5 categories)
    const coveredCategories = Object.values(counts).filter(c => c > 0).length
    const coverageScore = (coveredCategories / 5) * 50
    
    // Count: total skills (diminishing returns)
    const totalSkills = Object.values(counts).reduce((a, b) => a + b, 0)
    const countScore = Math.min(totalSkills * 3, 50)
    
    return Math.round(coverageScore + countScore)
  }
  const skillsScore = calculateSkillsScore()

  // 3. Resume Completeness Score
  const calculateCompletenessScore = () => {
    const criteria = [
      { value: resume.hasGithub, points: 15 },
      { value: resume.hasLinkedIn, points: 10 },
      { value: resume.hasPortfolio, points: 15 },
      { value: resume.hasProjects, points: 20 },
      { value: resume.hasExperience, points: 20 },
      { value: resume.hasCertifications, points: 10 },
      { value: resume.hasExtracurriculars, points: 10 },
    ]
    return criteria.reduce((sum, item) => sum + (item.value ? item.points : 0), 0)
  }
  const completenessScore = calculateCompletenessScore()

  // 4. GPA Score (scaled from 2.5-4.0 range to 0-100)
  const calculateGpaScore = () => {
    if (gpa === 0) return 0
    const MIN_GPA = 2.5
    const MAX_GPA = 4.0
    const normalized = Math.max(0, Math.min(1, (gpa - MIN_GPA) / (MAX_GPA - MIN_GPA)))
    return Math.round(normalized * 100)
  }
  const gpaScore = calculateGpaScore()

  // 5. Project Portfolio Score (count + diversity + relevance)
  const calculateProjectScore = () => {
    if (projects.length === 0) return 0
    
    const categorizeProject = (tech: string[]): string => {
      const techLower = tech.map(t => t.toLowerCase())
      if (techLower.some(t => t.includes('react native') || t.includes('flutter') || t.includes('swift') || t.includes('kotlin'))) return 'Mobile'
      if (techLower.some(t => t.includes('tensorflow') || t.includes('pytorch') || t.includes('pandas') || t.includes('machine learning'))) return 'Data/ML'
      if (techLower.some(t => t.includes('react') || t.includes('vue') || t.includes('angular') || t.includes('next') || t.includes('node'))) return 'Web'
      return 'Other'
    }

    const categories = new Set(projects.map(p => categorizeProject(p.technologies)))
    const diversity = categories.size
    
    // Base score from count (max 40)
    let score = Math.min(projects.length * 10, 40)
    // Diversity bonus (max 20)
    score += Math.min(diversity * 10, 20)
    // Relevance bonus if matching target roles (max 40)
    const relevantCategories = new Set<string>()
    roleTypes.forEach(role => roleToCategories[role]?.forEach(cat => relevantCategories.add(cat)))
    techSectors.forEach(sector => sectorToCategories[sector]?.forEach(cat => relevantCategories.add(cat)))
    
    if (relevantCategories.size > 0) {
      const relevantCount = projects.filter(p => relevantCategories.has(categorizeProject(p.technologies))).length
      score += Math.round((relevantCount / projects.length) * 40)
    } else {
      score += 20
    }
    
    return Math.min(score, 100)
  }
  const projectScore = calculateProjectScore()

  // 6. Internship Score (count + relevance)
  const calculateInternshipScore = () => {
    if (internships.length === 0) return 0
    
    // Base score from count
    let score = Math.min(internships.length * 35, 70)
    
    // Relevance bonus
    if (roleTypes.length > 0) {
      const calculateRelevance = (exp: Experience): boolean => {
        const expText = [exp.position, exp.company, ...exp.responsibilities, ...exp.technologies].join(' ').toLowerCase()
        return roleTypes.some(role => {
          const keywords = roleKeywords[role] || []
          return keywords.some(keyword => expText.includes(keyword))
        })
      }
      const relevantCount = internships.filter(calculateRelevance).length
      score += Math.round((relevantCount / internships.length) * 30)
    } else {
      score += 15
    }
    
    return Math.min(score, 100)
  }
  const internshipScore = calculateInternshipScore()

  // Calculate weighted total
  const totalScore = Math.round(
    (courseworkScore * WEIGHTS.coursework +
     skillsScore * WEIGHTS.skills +
     completenessScore * WEIGHTS.resumeCompleteness +
     gpaScore * WEIGHTS.gpa +
     projectScore * WEIGHTS.projects +
     internshipScore * WEIGHTS.internships) / 100
  )

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-emerald-600", bgColor: "bg-emerald-500" }
    if (score >= 65) return { label: "Very Good", color: "text-green-600", bgColor: "bg-green-500" }
    if (score >= 50) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-500" }
    if (score >= 35) return { label: "Fair", color: "text-amber-600", bgColor: "bg-amber-500" }
    return { label: "Needs Work", color: "text-red-600", bgColor: "bg-red-500" }
  }

  const status = getScoreStatus(totalScore)
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (totalScore / 100) * circumference

  const scoreBreakdown = [
    { label: "Projects", score: projectScore, weight: WEIGHTS.projects, icon: FolderKanban, color: "text-purple-500", bgColor: "bg-purple-500" },
    { label: "Internships", score: internshipScore, weight: WEIGHTS.internships, icon: Briefcase, color: "text-blue-500", bgColor: "bg-blue-500" },
    { label: "Skills", score: skillsScore, weight: WEIGHTS.skills, icon: Code, color: "text-green-500", bgColor: "bg-green-500" },
    { label: "Resume", score: completenessScore, weight: WEIGHTS.resumeCompleteness, icon: FileText, color: "text-orange-500", bgColor: "bg-orange-500" },
    { label: "GPA", score: gpaScore, weight: WEIGHTS.gpa, icon: GraduationCap, color: "text-yellow-500", bgColor: "bg-yellow-500" },
    { label: "Coursework", score: courseworkScore, weight: WEIGHTS.coursework, icon: Database, color: "text-cyan-500", bgColor: "bg-cyan-500" },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resume Score</CardTitle>
            <CardDescription>Overall strength of your resume based on multiple factors</CardDescription>
          </div>
          <Badge variant="outline" className={status.color}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Score Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="70" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted" />
                <circle
                  cx="96" cy="96" r="70" stroke="currentColor" strokeWidth="12" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                  className={cn("transition-all duration-1000 ease-out", status.bgColor)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold">{totalScore}</span>
                <span className="text-sm text-muted-foreground">out of 100</span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            {scoreBreakdown.map((item) => {
              const Icon = item.icon
              const contribution = Math.round((item.score * item.weight) / 100)
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <Icon className={cn("h-5 w-5", item.color)} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">
                        {item.score}/100 <span className="text-xs">({item.weight}%)</span>
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full overflow-hidden bg-muted mt-1">
                      <div
                        className={cn("h-full transition-all", item.bgColor)}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold w-8 text-right">+{contribution}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">How to improve: </span>
            {totalScore < 50 ? (
              "Focus on adding projects and gaining internship experience. These carry the most weight in your score."
            ) : totalScore < 70 ? (
              "You're on the right track! Consider diversifying your skills and adding more relevant projects."
            ) : (
              "Excellent progress! Keep maintaining your momentum and consider targeting more specialized experiences."
            )}
          </p>
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

// Removed mock internships - now using actual resume data

interface Experience {
  company: string
  position: string
  start_date: string
  end_date: string
  location: string
  responsibilities: string[]
  achievements: string[]
  technologies: string[]
}

// Keywords that indicate relevance to different role types
const roleKeywords: Record<string, string[]> = {
  "Frontend Developer": ["frontend", "react", "vue", "angular", "ui", "ux", "css", "html", "javascript", "typescript", "web"],
  "Backend Developer": ["backend", "api", "server", "database", "node", "python", "java", "go", "microservices"],
  "Full Stack Developer": ["full stack", "fullstack", "web", "frontend", "backend", "react", "node"],
  "Mobile Developer": ["mobile", "ios", "android", "swift", "kotlin", "react native", "flutter", "app"],
  "DevOps Engineer": ["devops", "ci/cd", "docker", "kubernetes", "aws", "azure", "gcp", "infrastructure", "cloud"],
  "Data Engineer": ["data engineer", "etl", "pipeline", "spark", "airflow", "data warehouse", "sql"],
  "Data Scientist": ["data scientist", "machine learning", "ml", "analytics", "statistics", "python", "r"],
  "Machine Learning Engineer": ["machine learning", "ml", "ai", "deep learning", "tensorflow", "pytorch", "model"],
  "Security Engineer": ["security", "cybersecurity", "penetration", "vulnerability", "infosec"],
  "QA / Test Engineer": ["qa", "test", "quality", "automation", "selenium", "cypress", "testing"],
  "Product Manager": ["product", "roadmap", "stakeholder", "agile", "scrum"],
  "Engineering Manager": ["manager", "lead", "team", "engineering manager", "tech lead"],
  "Solutions Architect": ["architect", "solution", "design", "system", "infrastructure"],
  "UI/UX Designer": ["design", "ui", "ux", "figma", "user experience", "prototype"],
}

function InternshipSummary({ 
  experiences, 
  roleTypes = [], 
  techSectors = [] 
}: { 
  experiences: Experience[]
  roleTypes?: string[]
  techSectors?: string[]
}) {
  // Filter to only internships
  const internships = experiences.filter(exp => 
    exp.position.toLowerCase().includes('intern')
  )
  const internshipCount = internships.length

  // Calculate relevance for each experience
  const calculateRelevance = (exp: Experience): boolean => {
    if (roleTypes.length === 0) return true
    
    const expText = [
      exp.position,
      exp.company,
      ...exp.responsibilities,
      ...exp.achievements,
      ...exp.technologies
    ].join(' ').toLowerCase()
    
    return roleTypes.some(role => {
      const keywords = roleKeywords[role] || []
      return keywords.some(keyword => expText.includes(keyword))
    })
  }

  const relevantInternships = internships.filter(calculateRelevance)
  const relevancePercent = internshipCount > 0 
    ? Math.round((relevantInternships.length / internshipCount) * 100) 
    : 0

  const getInternshipStatus = () => {
    if (internshipCount === 0) return {
      status: "Get Started",
      message: "No internships yet — that's okay! Focus on projects and skills to land your first opportunity.",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-900",
      icon: Briefcase
    }
    if (internshipCount === 1) {
      if (roleTypes.length > 0 && relevantInternships.length === 0) {
        return {
          status: "Good Start",
          message: "You have experience! Consider seeking internships more aligned with your target roles.",
          color: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-950/20",
          borderColor: "border-amber-200 dark:border-amber-900",
          icon: Briefcase
        }
      }
      return {
        status: "Great Start",
        message: "Having internship experience gives you a significant advantage. Keep building!",
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
        borderColor: "border-green-200 dark:border-green-900",
        icon: Briefcase
      }
    }
    if (roleTypes.length > 0 && relevancePercent < 50) {
      return {
        status: "Strong Experience",
        message: `Great experience! Consider targeting internships more aligned with your goal of ${roleTypes[0]}.`,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
        borderColor: "border-green-200 dark:border-green-900",
        icon: Star
      }
    }
    return {
      status: "Excellent!",
      message: "Outstanding experience highly relevant to your career goals. You're very competitive!",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-900",
      icon: Star
    }
  }

  const status = getInternshipStatus()
  const Icon = status.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internship Experience</CardTitle>
        <CardDescription>Your internship history and career alignment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-4xl font-bold">{internshipCount}</p>
            <p className="text-sm text-muted-foreground">
              {internshipCount === 1 ? "Internship" : "Internships"}
            </p>
          </div>
          {roleTypes.length > 0 && internshipCount > 0 && (
            <div>
              <p className="text-4xl font-bold text-primary">{relevantInternships.length}</p>
              <p className="text-sm text-muted-foreground">Role-Aligned</p>
            </div>
          )}
        </div>

        {/* Status box */}
        <div className={cn("p-4 rounded-lg border", status.bgColor, status.borderColor)}>
          <div className="flex items-start gap-3">
            <Icon className={cn("h-5 w-5 mt-0.5", status.color)} />
            <div>
              <h4 className={cn("font-semibold", status.color)}>{status.status}</h4>
              <p className="text-sm text-muted-foreground mt-1">{status.message}</p>
              {roleTypes.length > 0 && internshipCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {relevantInternships.length} of {internshipCount} aligned with target roles
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Internship list */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {internships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No internships found in your resume</p>
              <p className="text-sm mt-1">Your first internship is just around the corner!</p>
            </div>
          ) : (
            internships.map((exp, idx) => {
              const isRelevant = calculateRelevance(exp)
              return (
                <div
                  key={idx}
                  className={cn(
                    "p-3 border rounded-lg bg-muted/5 dark:bg-muted/20 space-y-2",
                    isRelevant && roleTypes.length > 0 && "border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{exp.position}</p>
                      <p className="text-sm text-muted-foreground">{exp.company} • {exp.location}</p>
                    </div>
                    {isRelevant && roleTypes.length > 0 && (
                      <Badge variant="outline" className="shrink-0 border-primary/50 text-primary">
                        <Target className="h-3 w-3 mr-1" /> Relevant
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} 
                    {" — "}
                    {exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Present"}
                  </p>
                  {exp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {exp.technologies.slice(0, 5).map((tech, tidx) => (
                        <Badge key={tidx} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {exp.technologies.length > 5 && (
                        <Badge variant="secondary" className="text-xs">+{exp.technologies.length - 5}</Badge>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
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

// Skills that are relevant to each role (for calculating match)
const roleRequiredSkills: Record<string, { languages: string[], frameworks: string[], databases: string[], devops: string[] }> = {
  "Frontend Developer": {
    languages: ["javascript", "typescript", "html", "css"],
    frameworks: ["react", "vue", "angular", "next.js", "nextjs", "tailwind", "svelte"],
    databases: ["firebase", "indexeddb"],
    devops: ["webpack", "vite", "npm", "git", "yarn"]
  },
  "Backend Developer": {
    languages: ["python", "java", "go", "node.js", "nodejs", "c#", "ruby", "php"],
    frameworks: ["express", "django", "spring", "fastapi", ".net", "flask", "rails"],
    databases: ["postgresql", "mysql", "mongodb", "redis", "sql server"],
    devops: ["docker", "kubernetes", "aws", "linux", "ci/cd"]
  },
  "Full Stack Developer": {
    languages: ["javascript", "typescript", "python", "sql"],
    frameworks: ["react", "next.js", "nextjs", "node", "express", "django"],
    databases: ["postgresql", "mongodb", "redis", "mysql"],
    devops: ["docker", "git", "aws", "vercel"]
  },
  "Mobile Developer": {
    languages: ["swift", "kotlin", "dart", "javascript", "typescript", "java"],
    frameworks: ["react native", "flutter", "swiftui", "jetpack"],
    databases: ["sqlite", "realm", "firebase"],
    devops: ["xcode", "android studio", "fastlane", "git"]
  },
  "DevOps Engineer": {
    languages: ["python", "bash", "go", "yaml", "shell"],
    frameworks: ["terraform", "ansible", "helm", "jenkins"],
    databases: ["postgresql", "redis", "elasticsearch"],
    devops: ["docker", "kubernetes", "aws", "azure", "gcp", "prometheus", "grafana", "ci/cd"]
  },
  "Data Engineer": {
    languages: ["python", "sql", "scala", "java"],
    frameworks: ["spark", "airflow", "dbt", "kafka"],
    databases: ["postgresql", "snowflake", "bigquery", "redshift", "delta lake"],
    devops: ["docker", "kubernetes", "aws", "gcp"]
  },
  "Data Scientist": {
    languages: ["python", "r", "sql", "julia"],
    frameworks: ["pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "jupyter"],
    databases: ["postgresql", "bigquery", "snowflake"],
    devops: ["git", "docker", "mlflow"]
  },
  "Machine Learning Engineer": {
    languages: ["python", "c++", "julia", "sql"],
    frameworks: ["tensorflow", "pytorch", "keras", "hugging face", "mlflow", "kubeflow"],
    databases: ["postgresql", "mongodb", "pinecone", "weaviate"],
    devops: ["docker", "kubernetes", "aws", "sagemaker"]
  },
  "Security Engineer": {
    languages: ["python", "go", "c", "bash", "powershell"],
    frameworks: ["owasp", "metasploit", "burp suite", "nessus"],
    databases: ["postgresql", "elasticsearch", "splunk"],
    devops: ["docker", "kubernetes", "terraform", "aws"]
  },
  "QA / Test Engineer": {
    languages: ["javascript", "python", "java", "typescript"],
    frameworks: ["selenium", "cypress", "jest", "playwright", "appium"],
    databases: ["postgresql", "mysql", "mongodb"],
    devops: ["jenkins", "git", "docker", "ci/cd"]
  },
  "UI/UX Designer": {
    languages: ["html", "css", "javascript"],
    frameworks: ["figma", "sketch", "adobe xd", "framer"],
    databases: [],
    devops: ["git", "zeplin"]
  },
}

function RoleSkillsMatch({ 
  skills,
  roleTypes = []
}: { 
  skills: typeof mockStudentData.skills
  roleTypes?: string[]
}) {
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

  // Get all user skills as lowercase for matching
  const userSkills = [
    ...skills.programmingLanguages,
    ...skills.frameworks,
    ...skills.databases,
    ...skills.devops
  ].map(s => s.toLowerCase())

  // Calculate match for each role
  const calculateRoleMatch = (role: string): { matched: number, total: number, matchedSkills: string[] } => {
    const required = roleRequiredSkills[role]
    if (!required) return { matched: 0, total: 0, matchedSkills: [] }

    const allRequired = [
      ...required.languages,
      ...required.frameworks,
      ...required.databases,
      ...required.devops
    ]

    const matchedSkills = allRequired.filter(req => 
      userSkills.some(skill => skill.includes(req) || req.includes(skill))
    )

    return {
      matched: matchedSkills.length,
      total: allRequired.length,
      matchedSkills
    }
  }

  // Calculate matches for all roles and sort by match percentage
  const allRoleMatches = Object.keys(roleRequiredSkills).map(role => {
    const { matched, total, matchedSkills } = calculateRoleMatch(role)
    const percentage = total > 0 ? Math.round((matched / total) * 100) : 0
    return { role, matched, total, percentage, matchedSkills }
  }).sort((a, b) => b.percentage - a.percentage)

  // Get top 3 roles
  const topRoles = allRoleMatches.slice(0, 3)

  // Check if any target roles are in top 3
  const targetRolesInTop = roleTypes.filter(r => topRoles.some(tr => tr.role === r))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role-Relevant Skills Match</CardTitle>
        <CardDescription>
          Top 3 fields that best match your extracted skills
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topRoles}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="percentage"
                  label={(entry) => `${entry.percentage}%`}
                >
                  {topRoles.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {topRoles.map((role, index) => {
              const isTargetRole = roleTypes.includes(role.role)
              return (
                <div key={role.role} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="font-semibold">{role.role}</span>
                      {isTargetRole && (
                        <Badge variant="outline" className="text-xs border-primary text-primary">
                          <Target className="h-3 w-3 mr-1" /> Target
                        </Badge>
                      )}
                    </div>
                    <Badge>{role.percentage}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground pl-5">
                    {role.matched}/{role.total} skills matched
                  </p>
                  <div className="relative h-2 w-full rounded-full overflow-hidden bg-muted pl-5">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${role.percentage}%`, backgroundColor: COLORS[index] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {roleTypes.length > 0 && targetRolesInTop.length === 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Your target roles ({roleTypes.slice(0, 2).join(", ")}{roleTypes.length > 2 ? "..." : ""}) aren&apos;t in your top 3 matches yet. Consider building skills in those areas!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overall")
  const { resumeData, isLoading, currentFileName } = useResume()

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
            <p className="mt-2 text-muted-foreground">
              {currentFileName ? (
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Currently viewing: <span className="font-medium">{currentFileName}</span>
                </span>
              ) : (
                "Loading resume..."
              )}
            </p>
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
            <p className="mt-2 text-muted-foreground">Upload a resume to get started</p>
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
          <p className="mt-2 text-muted-foreground">
            {currentFileName ? (
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Currently viewing: <span className="font-medium">{currentFileName}</span>
              </span>
            ) : (
              "Your personalized insights"
            )}
          </p>
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
            {/* Resume Score - Always visible at top */}
            <OverallResumeScore
              gpa={studentData.gpa}
              skills={studentData.skills}
              resume={studentData.resume}
              projects={resumeData?.projects || []}
              internships={(resumeData?.experience || []).filter(exp => exp.position.toLowerCase().includes('intern'))}
              courseworkCategories={3} // TODO: Calculate from actual coursework data
              roleTypes={questionnaireData?.roleTypes}
              techSectors={questionnaireData?.techSectors}
            />
            
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
                  <SkillsRadarChart skills={studentData.skills} roleTypes={questionnaireData?.roleTypes} />
                </AccordionContent>
              </AccordionItem>

              {/* Technology Stack Alignment - Hidden for now
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
              */}

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
                  <SkillsRadarChart skills={studentData.skills} roleTypes={questionnaireData?.roleTypes} />
                </AccordionContent>
              </AccordionItem>

              {/* Technology Stack Alignment - Hidden for now
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
              */}
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
                  <ProjectPortfolioSummary 
                    projects={resumeData?.projects || []} 
                    roleTypes={questionnaireData?.roleTypes}
                    techSectors={questionnaireData?.techSectors}
                  />
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
                  <InternshipSummary 
                    experiences={resumeData?.experience || []} 
                    roleTypes={questionnaireData?.roleTypes}
                    techSectors={questionnaireData?.techSectors}
                  />
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
                  <RoleSkillsMatch skills={studentData.skills} roleTypes={questionnaireData?.roleTypes} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
