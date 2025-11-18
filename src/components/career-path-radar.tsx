"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import { Loader2, Check, X } from "lucide-react"

interface CourseMatch {
  resumeCourse: string
  ufCourse: {
    name: string
    code: string
  }
  score: number
  category: string
}

interface MatchResponse {
  success: boolean
  matches: CourseMatch[]
  byCategory: Record<string, CourseMatch[]>
  allUFCourses?: Array<{ name: string; code: string; category: string }>
  message?: string
  lastUpdated?: string
}

// CS Course Categories - will be populated from matched courses
const DEFAULT_CATEGORIES = [
  "Core CS",
  "Software Engineering",
  "AI & Machine Learning",
  "Systems & Hardware",
  "Data & Databases",
  "Security & Privacy",
  "Graphics & Media",
  "Theory & Math",
]

export function CareerPathCourseworkChart() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [matchedCourses, setMatchedCourses] = useState<Record<string, CourseMatch[]>>({})
  const [allUFCoursesByCategory, setAllUFCoursesByCategory] = useState<Record<string, Array<{ name: string; code: string }>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load matched courses from cached data
  useEffect(() => {
    const loadMatchedCourses = async () => {
      try {
        setIsLoading(true)
        // Use the new cached endpoint instead of recalculating every time
        const response = await fetch("/api/matched-courses")
        const data: MatchResponse = await response.json()

        if (data.success) {
          setMatchedCourses(data.byCategory)
          
          // Also get all UF courses categorized
          if (data.allUFCourses) {
            const categorized: Record<string, Array<{ name: string; code: string }>> = {}
            data.allUFCourses.forEach(course => {
              if (!categorized[course.category]) {
                categorized[course.category] = []
              }
              categorized[course.category].push({ name: course.name, code: course.code })
            })
            setAllUFCoursesByCategory(categorized)
          }
          
          console.log("Loaded matched courses from cache:", data.byCategory)
        } else {
          setError(data.message || "Failed to load course matches")
        }
      } catch (err) {
        console.error("Error loading matched courses:", err)
        setError("Error loading course data. Please upload your resume first.")
      } finally {
        setIsLoading(false)
      }
    }

    loadMatchedCourses()
  }, [])

  // Calculate completion percentage for each category
  // Based on how many courses are taken vs available
  const getCategoryCompletion = (category: string): number => {
    const takenCourses = matchedCourses[category] || []
    const availableCourses = allUFCoursesByCategory[category] || []
    
    if (availableCourses.length === 0) return 0
    
    // Percentage = (taken / available) * 100
    return Math.round((takenCourses.length / availableCourses.length) * 100)
  }

  // Calculate category averages for radar chart
  const categoryRadarData = DEFAULT_CATEGORIES.map((category) => ({
    category,
    average: getCategoryCompletion(category),
  }))

  // Check if a course has been taken
  const isCourseTaken = (category: string, courseCode: string): boolean => {
    const takenCourses = matchedCourses[category] || []
    return takenCourses.some(match => match.ufCourse.code === courseCode)
  }

  // Get all courses for selected category
  const getAllCoursesForCategory = (category: string) => {
    return allUFCoursesByCategory[category] || []
  }

  // Toggle course completion (check/uncheck)
  const toggleCourse = async (category: string, courseCode: string, courseName: string) => {
    const isTaken = isCourseTaken(category, courseCode)
    const action = isTaken ? "uncheck" : "check"
    
    setIsSaving(true)
    
    try {
      const response = await fetch("/api/toggle-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseCode,
          category,
          courseName,
          action,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update local state with new data
        setMatchedCourses(data.byCategory)
      } else {
        console.error("Failed to toggle course:", data.error)
      }
    } catch (error) {
      console.error("Error toggling course:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coursework by CS Category</CardTitle>
          <CardDescription>Loading your matched courses...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coursework by CS Category</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coursework by CS Category</CardTitle>
        <CardDescription>
          Click on a category to see your course completion in that area
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Top: Category buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-lg border-2 transition-all font-medium",
                selectedCategory === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/50"
              )}
            >
              All Categories
            </button>
            {DEFAULT_CATEGORIES.map((category) => {
              const completion = getCategoryCompletion(category)
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 transition-all font-medium flex items-center gap-2",
                    selectedCategory === category
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  {category}
                  <Badge variant={selectedCategory === category ? "outline" : "secondary"} className={selectedCategory === category ? "bg-primary-foreground text-primary" : ""}>
                    {completion}%
                  </Badge>
                </button>
              )
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Radar chart showing all 8 categories */}
            <div className="flex-1 h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fontSize: 11 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar
                    name="Category Average"
                    dataKey="average"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.4}
                  />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Right: Course list filtered by category */}
            <div className="flex-1 space-y-3 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-2 sticky top-0 bg-background z-10 pb-2">
                {selectedCategory 
                  ? `${selectedCategory} Courses` 
                  : "All Courses"}
              </h3>
              
              {selectedCategory ? (
                // Show all courses for selected category with taken/not taken status
                <>
                  {getAllCoursesForCategory(selectedCategory).map((course) => {
                    const taken = isCourseTaken(selectedCategory, course.code)
                    
                    return (
                      <button
                        key={course.code}
                        onClick={() => toggleCourse(selectedCategory, course.code, course.name)}
                        disabled={isSaving}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                          "hover:shadow-md active:scale-[0.98]",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          taken 
                            ? "border-green-500 bg-green-50 dark:bg-green-950/20 hover:border-green-600" 
                            : "border-gray-300 bg-gray-50 dark:bg-gray-950/20 hover:border-gray-400"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 transition-colors",
                          taken ? "bg-green-500" : "bg-gray-300"
                        )}>
                          {taken ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <X className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{course.code}</div>
                          <div className="text-xs text-muted-foreground">{course.name}</div>
                        </div>
                        {taken && (
                          <Badge variant="default" className="bg-green-600">
                            Taken
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                  {getAllCoursesForCategory(selectedCategory).length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No courses available in this category
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Courses taken:{" "}
                      <span className="font-bold text-foreground">
                        {(matchedCourses[selectedCategory] || []).length} / {getAllCoursesForCategory(selectedCategory).length}
                      </span>
                      {" "}({getCategoryCompletion(selectedCategory)}%)
                      {isSaving && <span className="ml-2 text-xs">(Saving...)</span>}
                    </p>
                  </div>
                </>
              ) : (
                // Show all courses grouped by category
                <>
                  {DEFAULT_CATEGORIES.map((category) => {
                    const allCourses = getAllCoursesForCategory(category)
                    const takenCourses = matchedCourses[category] || []
                    if (allCourses.length === 0) return null
                    
                    return (
                      <div key={category} className="mb-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          {category} ({takenCourses.length}/{allCourses.length} completed)
                        </h4>
                        <div className="space-y-2">
                          {allCourses.slice(0, 5).map((course) => {
                            const taken = isCourseTaken(category, course.code)
                            return (
                              <button
                                key={course.code}
                                onClick={() => toggleCourse(category, course.code, course.name)}
                                disabled={isSaving}
                                className={cn(
                                  "w-full flex items-center gap-2 p-2 rounded-lg border transition-all",
                                  "hover:shadow-sm active:scale-[0.98]",
                                  "disabled:opacity-50 disabled:cursor-not-allowed",
                                  taken 
                                    ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10 hover:border-green-500" 
                                    : "border-gray-300/50 bg-gray-50/50 dark:bg-gray-950/10 hover:border-gray-400"
                                )}
                              >
                                <div className={cn(
                                  "flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 transition-colors",
                                  taken ? "bg-green-500" : "bg-gray-300"
                                )}>
                                  {taken ? (
                                    <Check className="w-3 h-3 text-white" />
                                  ) : (
                                    <X className="w-2 h-2 text-gray-500" />
                                  )}
                                </div>
                                <div className="flex-1 text-left">
                                  <span className="font-medium text-sm">{course.code}</span>
                                  <span className="text-xs text-muted-foreground ml-2">{course.name}</span>
                                </div>
                              </button>
                            )
                          })}
                          {allCourses.length > 5 && (
                            <button
                              onClick={() => setSelectedCategory(category)}
                              className="w-full text-sm text-primary hover:underline"
                            >
                              View all {allCourses.length} courses →
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(allUFCoursesByCategory).length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No courses available. Make sure you have relevant coursework in your resume.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
