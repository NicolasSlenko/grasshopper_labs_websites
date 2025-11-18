/**
 * Utility functions for matching resume coursework to UF course catalog
 */

interface UFCourse {
  name: string
  code: string
}

interface CourseMatch {
  resumeCourse: string
  ufCourse: UFCourse
  score: number
}

/**
 * Calculate Levenshtein distance between two strings
 * (measures edit distance - lower is more similar)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity score (0-100) between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  // Exact match
  if (s1 === s2) return 100

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 90
  }

  // Calculate based on Levenshtein distance
  const maxLen = Math.max(s1.length, s2.length)
  const distance = levenshteinDistance(s1, s2)
  const similarity = ((maxLen - distance) / maxLen) * 100

  // Boost score if key words match
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  const commonWords = words1.filter((w) => words2.includes(w))
  const wordBonus = (commonWords.length / Math.max(words1.length, words2.length)) * 20

  return Math.min(100, similarity + wordBonus)
}

/**
 * Extract coursework list from resume achievements string
 * Example: "Relevant Coursework: Course1, Course2, Course3"
 */
export function extractCoursework(achievementsArray: string[]): string[] {
  const coursework: string[] = []

  for (const achievement of achievementsArray) {
    // Look for "Relevant Coursework:" or similar patterns
    const match = achievement.match(/relevant coursework:(.+)/i)
    if (match) {
      const courseString = match[1]
      // Split by commas and clean up
      const courses = courseString
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
      coursework.push(...courses)
    }
  }

  return coursework
}

/**
 * Match resume coursework to UF courses using fuzzy matching
 * @param resumeCourses - List of course names from resume
 * @param ufCourses - List of UF courses from API
 * @param threshold - Minimum similarity score (0-100) to consider a match
 * @returns Array of matches with scores
 */
export function matchCoursework(
  resumeCourses: string[],
  ufCourses: UFCourse[],
  threshold: number = 60
): CourseMatch[] {
  const matches: CourseMatch[] = []

  for (const resumeCourse of resumeCourses) {
    let bestMatch: CourseMatch | null = null
    let bestScore = 0

    for (const ufCourse of ufCourses) {
      const score = calculateSimilarity(resumeCourse, ufCourse.name)

      if (score > bestScore && score >= threshold) {
        bestScore = score
        bestMatch = {
          resumeCourse,
          ufCourse,
          score,
        }
      }
    }

    if (bestMatch) {
      matches.push(bestMatch)
    }
  }

  return matches.sort((a, b) => b.score - a.score)
}

/**
 * Common UF course prefixes for CS and related technical courses
 */
export const UF_CS_PREFIXES = [
  // Computer Science & Engineering
  "COP", // Computer Programming
  "CDA", // Computer Design & Architecture
  "CAP", // Computer Applications
  "COT", // Computing Theory
  "CIS", // Computer Information Science
  "CNT", // Computer Networking
  "CEN", // Computer Engineering
  
  // Electrical & Computer Engineering
  "EEL", // Electrical Engineering
  "EEE", // Electrical Engineering Electives
  
  // Mathematics & Statistics
  "STA", // Statistics
  "MAS", // Applied & Computational Mathematics
  "MAA", // Analysis
  "MAD", // Discrete Mathematics
  "MAP", // Applied Mathematics
  "MHF", // History of Mathematics / Math Foundations
  "MTG", // Topology & Geometry
]

/**
 * Categorize UF courses into CS categories
 * IMPORTANT: Each course belongs to ONLY ONE category
 * Categories are checked in priority order - first match wins
 */
export function categorizeUFCourse(courseCode: string, courseName: string): string {
  const code = courseCode.toUpperCase()
  const name = courseName.toLowerCase()

  // EXCLUSIONS: Courses to completely remove
  const excludedCourses = [
    "EEL3834",  // Removed per user request
    "CIS4715",  // Too general
    "CIS4905",  // Independent study
    "CIS4914",  // Senior project
    "CIS4940",  // Internship/practical work
  ]
  
  // Check for excluded patterns
  if (
    excludedCourses.includes(code) ||
    name.includes("independent study") ||
    name.includes("individual study") ||
    name.includes("teaching") ||
    name.includes("learning assistant") ||
    name.includes("senior project") ||
    name.includes("practical work") ||
    name.includes("internship") ||
    name.includes("overseas study") ||
    name.includes("study abroad") ||
    code.includes("4930") // Generic special topics/practical work
  ) {
    return "EXCLUDED" // Mark for filtering out
  }

  // PRIORITY 1: AI & Machine Learning (can include some STA courses related to ML/AI)
  if (
    name.includes("machine learning") ||
    name.includes("artificial intelligence") ||
    name.includes("deep learning") ||
    name.includes("neural network") ||
    name.includes("natural language") ||
    name.includes("nlp") ||
    name.includes("computer vision") ||
    name.includes("intelligent system") ||
    name.includes("data mining") ||
    name.includes("pattern recognition") ||
    code === "EEL4773" || // Fundamentals of Machine Learning
    code === "CAP4641" || // Natural Language Processing
    code === "CAP4630" || // Artificial Intelligence
    // STA courses that are ML/AI relevant
    (code.startsWith("STA") && (
      name.includes("machine learning") ||
      name.includes("statistical learning") ||
      name.includes("data mining") ||
      name.includes("multivariate") ||
      name.includes("time series")
    ))
  ) {
    return "AI & Machine Learning"
  }

  // PRIORITY 2: Security & Privacy (NO STA courses allowed here)
  if (
    !code.startsWith("STA") && // Explicitly exclude all STA courses
    (
      name.includes("security") ||
      name.includes("cryptography") ||
      name.includes("crypto") ||
      name.includes("privacy") ||
      name.includes("secure") ||
      name.includes("malware") ||
      name.includes("reverse engineering") ||
      code === "CIS4362" || // Information/Computer Security
      code === "CIS4204"    // Ethical Hacking
    )
  ) {
    return "Security & Privacy"
  }

  // PRIORITY 3: Graphics & Media
  if (
    name.includes("graphics") ||
    name.includes("game") ||
    name.includes("visualization") ||
    name.includes("rendering") ||
    name.includes("animation") ||
    name.includes("ui") ||
    name.includes("ux") ||
    name.includes("user interface") ||
    name.includes("human-computer") ||
    name.includes("multimedia") ||
    code === "CAP4720" || // Computer Graphics Systems
    code === "CAP4053"    // Introduction to Computer Graphics Applications
  ) {
    return "Graphics & Media"
  }

  // PRIORITY 4: Software Engineering (NO STA courses allowed here)
  if (
    !code.startsWith("STA") && // Explicitly exclude all STA courses
    (
      name.includes("software engineering") ||
      name.includes("software development") ||
      name.includes("agile") ||
      name.includes("devops") ||
      name.includes("web application") ||
      name.includes("mobile") ||
      name.includes("android") ||
      name.includes("ios") ||
      code === "CEN3031" || // Introduction to Software Engineering
      code === "CEN4010"    // Software Engineering I
    )
  ) {
    return "Software Engineering"
  }

  // PRIORITY 5: Data & Databases
  if (
    name.includes("database") ||
    name.includes("data science") ||
    name.includes("big data") ||
    name.includes("data warehouse") ||
    name.includes("cloud computing") ||
    name.includes("distributed system") ||
    code === "COP4710" || // Database Management Systems
    code === "CIS4301" || // Information and Database Systems
    code === "COT4500"    // Numerical Analysis (data-heavy)
  ) {
    return "Data & Databases"
  }

  // PRIORITY 6: Systems & Hardware (moved EEL4732 here explicitly)
  if (
    code === "EEL4732" || // Moved from Core CS
    code.startsWith("CDA") ||
    code.startsWith("EEL") ||
    code.startsWith("EEE") ||
    name.includes("operating system") ||
    name.includes("computer organization") ||
    name.includes("computer architecture") ||
    name.includes("network") ||
    name.includes("embedded") ||
    name.includes("hardware") ||
    name.includes("digital") ||
    name.includes("microprocessor") ||
    name.includes("parallel") ||
    name.includes("concurrent") ||
    code === "CDA3101" || // Computer Organization
    code === "COP4600" || // Operating Systems
    code === "CNT4007"    // Computer Networks
  ) {
    return "Systems & Hardware"
  }

  // PRIORITY 7: Core CS (fundamental CS courses, EXCLUDING EEL3832, EEL4732, and STA courses)
  if (
    code !== "EEL3832" && // Explicitly exclude
    code !== "EEL4732" && // Explicitly exclude (moved to Systems)
    !code.startsWith("STA") && // Move all STA courses out of Core CS
    (
      name.includes("data structure") ||
      name.includes("algorithm") ||
      name.includes("programming") ||
      name.includes("object-oriented") ||
      name.includes("software development") ||
      name.includes("compiler") ||
      name.includes("programming language") ||
      code === "COP3530" || // Data Structures and Algorithms
      code === "COP3503" || // Programming Fundamentals
      code === "COP3504" || // Advanced Programming Fundamentals
      code === "COT3100" || // Applications of Discrete Structures
      code === "COP4020"    // Programming Language Concepts
    )
  ) {
    return "Core CS"
  }

  // PRIORITY 8: Theory & Math (most general, includes all remaining STA courses)
  if (
    code.startsWith("COT") ||
    code.startsWith("STA") || // All remaining STA courses go here (unless caught by AI/ML)
    code.startsWith("MAS") ||
    code.startsWith("MAA") ||
    code.startsWith("MAD") ||
    code.startsWith("MAP") ||
    code.startsWith("MHF") ||
    code.startsWith("MTG") ||
    name.includes("theory") ||
    name.includes("discrete math") ||
    name.includes("linear algebra") ||
    name.includes("probability") ||
    name.includes("statistics") ||
    name.includes("calculus") ||
    name.includes("differential equation") ||
    name.includes("mathematical") ||
    name.includes("numerical") ||
    code === "COT4210"    // Computational Theory
  ) {
    return "Theory & Math"
  }

  // Default to Core CS for any remaining COP/CAP/CIS courses
  if (code.startsWith("COP") || code.startsWith("CAP") || code.startsWith("CIS")) {
    return "Core CS"
  }

  // Fallback for any other courses
  return "Theory & Math"
}
