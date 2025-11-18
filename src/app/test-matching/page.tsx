"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

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
  resumeCourses: string[]
  matches: CourseMatch[]
  byCategory: Record<string, CourseMatch[]>
  totalMatches: number
  ufCoursesScanned: number
}

export default function CourseMatchingTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MatchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runMatching = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch("/api/match-coursework")
      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.message || "Failed to match coursework")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">UF Course Matching Test</h1>
        <p className="text-muted-foreground">
          Test the fuzzy matching between your resume coursework and UF course catalog
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run Course Matching</CardTitle>
          <CardDescription>
            This will scan all UF CS courses and match them to your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runMatching} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Matching Courses..." : "Match Coursework"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Matching Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Resume Courses</p>
                  <p className="text-2xl font-bold">{results.resumeCourses.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">UF Courses Scanned</p>
                  <p className="text-2xl font-bold">{results.ufCoursesScanned}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Matches Found</p>
                  <p className="text-2xl font-bold">{results.totalMatches}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Your Resume Courses:</h3>
                <div className="flex flex-wrap gap-2">
                  {results.resumeCourses.map((course, idx) => (
                    <Badge key={idx} variant="secondary">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Matches by Category</h2>
            {Object.entries(results.byCategory).map(([category, matches]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                  <CardDescription>{matches.length} match(es) found</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {matches.map((match, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-4 bg-muted/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{match.resumeCourse}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Matched to: <span className="font-mono">{match.ufCourse.code}</span> -{" "}
                              {match.ufCourse.name}
                            </p>
                          </div>
                          <Badge
                            variant={
                              match.score >= 90
                                ? "default"
                                : match.score >= 75
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {match.score.toFixed(0)}% match
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.matches.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No matches found above the threshold
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
