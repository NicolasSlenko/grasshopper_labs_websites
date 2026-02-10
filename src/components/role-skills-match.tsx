"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { ChevronDown, ChevronUp, Check, X, Target, Star } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface SkillsData {
  programmingLanguages: string[]
  frameworks: string[]
  databases: string[]
  devops: string[]
}

interface RoleSkillsMatchProps {
  skills?: SkillsData
  roleTypes?: string[]
}

interface CategoryBreakdown {
  category: string
  matched: string[]
  missing: string[]
  required: string[]
}

interface RoleMatch {
  role: string
  matched: number
  total: number
  percentage: number
  matchedSkills: string[]
  missingSkills: string[]
  categoryBreakdown: CategoryBreakdown[]
}

export function RoleSkillsMatch({ skills, roleTypes = [] }: RoleSkillsMatchProps) {
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

  // Default skills if none provided
  const defaultSkills: SkillsData = {
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    devops: []
  }

  const userSkillsData = skills || defaultSkills

  // Get all user skills as lowercase for matching
  const userSkills = [
    ...userSkillsData.programmingLanguages,
    ...userSkillsData.frameworks,
    ...userSkillsData.databases,
    ...userSkillsData.devops
  ].map(s => s.toLowerCase())

  // Calculate match for each role with category breakdown
  const calculateRoleMatch = (role: string): RoleMatch => {
    const required = roleRequiredSkills[role]
    if (!required) return { 
      role, 
      matched: 0, 
      total: 0, 
      percentage: 0, 
      matchedSkills: [], 
      missingSkills: [],
      categoryBreakdown: [] 
    }

    const categories = [
      { name: "Languages", required: required.languages, userCategory: userSkillsData.programmingLanguages },
      { name: "Frameworks", required: required.frameworks, userCategory: userSkillsData.frameworks },
      { name: "Databases", required: required.databases, userCategory: userSkillsData.databases },
      { name: "DevOps", required: required.devops, userCategory: userSkillsData.devops },
    ]

    const categoryBreakdown: CategoryBreakdown[] = categories.map(cat => {
      const userCatLower = cat.userCategory.map(s => s.toLowerCase())
      const matched = cat.required.filter(req => 
        userSkills.some(skill => skill.includes(req) || req.includes(skill))
      )
      const missing = cat.required.filter(req => 
        !userSkills.some(skill => skill.includes(req) || req.includes(skill))
      )
      return {
        category: cat.name,
        matched,
        missing,
        required: cat.required
      }
    }).filter(cat => cat.required.length > 0) // Only show categories with required skills

    const allRequired = [
      ...required.languages,
      ...required.frameworks,
      ...required.databases,
      ...required.devops
    ]

    const matchedSkills = allRequired.filter(req => 
      userSkills.some(skill => skill.includes(req) || req.includes(skill))
    )
    const missingSkills = allRequired.filter(req => 
      !userSkills.some(skill => skill.includes(req) || req.includes(skill))
    )

    const percentage = allRequired.length > 0 ? Math.round((matchedSkills.length / allRequired.length) * 100) : 0

    return {
      role,
      matched: matchedSkills.length,
      total: allRequired.length,
      percentage,
      matchedSkills,
      missingSkills,
      categoryBreakdown
    }
  }

  // Calculate matches for all roles and sort by match percentage
  const allRoleMatches = Object.keys(roleRequiredSkills).map(role => calculateRoleMatch(role))
    .sort((a, b) => b.percentage - a.percentage)

  // Get top 3 roles
  const topRoles = allRoleMatches.slice(0, 3)

  // Check if any target roles are in top 3
  const targetRolesInTop = roleTypes.filter(r => topRoles.some(tr => tr.role === r))

  const toggleExpanded = (role: string) => {
    setExpandedRole(expandedRole === role ? null : role)
  }

  // Transform data for pie chart (needs simpler structure)
  const chartData = topRoles.map(r => ({
    role: r.role,
    percentage: r.percentage
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role-Relevant Skills Match</CardTitle>
        <CardDescription>
          Top 3 fields that best match your extracted skills. Click to see details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="percentage"
                  label={(entry) => `${entry.percentage}%`}
                >
                  {chartData.map((entry, index) => (
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
              const isExpanded = expandedRole === role.role
              return (
                <div key={role.role} className="space-y-2">
                  <button
                    onClick={() => toggleExpanded(role.role)}
                    className="w-full text-left"
                  >
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
                      <div className="flex items-center gap-2">
                        <Badge>{role.percentage}%</Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground pl-5">
                      {role.matched}/{role.total} skills matched
                    </p>
                  </button>
                  <div className="relative h-2 w-full rounded-full overflow-hidden bg-muted ml-5">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${role.percentage}%`, backgroundColor: COLORS[index] }}
                    />
                  </div>
                  
                  {/* Expanded skill details */}
                  {isExpanded && (
                    <div className="ml-5 mt-3 space-y-3 border-l-2 pl-4" style={{ borderColor: COLORS[index] }}>
                      {role.categoryBreakdown.map((cat) => (
                        <div key={cat.category} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{cat.category}</span>
                            <span className="text-xs text-muted-foreground">
                              {cat.matched.length}/{cat.required.length}
                            </span>
                          </div>
                          
                          {/* Matched skills */}
                          {cat.matched.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {cat.matched.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="text-xs bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Missing skills */}
                          {cat.missing.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {cat.missing.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="text-xs bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Summary */}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-green-600 dark:text-green-400">{role.matched} skills</span> matched, 
                          <span className="font-medium text-red-600 dark:text-red-400 ml-1">{role.missingSkills.length} skills</span> to learn
                        </p>
                      </div>
                    </div>
                  )}
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
