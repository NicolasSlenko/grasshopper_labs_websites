import type { Resume } from "@/app/api/parse/resumeSchema"
import {
  analyzeProjectQuality,
  analyzeExperienceQuality,
  analyzeSkillsQuality,
  analyzeLinksQuality,
  analyzeGPAQuality,
  analyzeCourseworkQuality,
  generateAllInsights,
  type ActionableInsight
} from "./qualityAnalysis"

/**
 * Calculate the overall resume score based on parsed resume data.
 * 
 * NEW Scoring System (Quality + Quantity):
 * 
 * Weights:
 * - Projects: 25% (combines quality + quantity)
 * - Experience: 25% (internships + research + TA + jobs)
 * - Skills: 15%
 * - Links + Contact: 10%
 * - GPA: 10% (threshold-based)
 * - Coursework: 15%
 */

export interface ScoreBreakdown {
  category: string
  qualityScore: number
  quantityScore: number
  combinedScore: number
  weight: number
  contribution: number
}

export interface ResumeScoreResult {
  totalScore: number
  breakdown: ScoreBreakdown[]
  insights: ActionableInsight[]
  analysis: {
    projects: ReturnType<typeof analyzeProjectQuality>
    experience: ReturnType<typeof analyzeExperienceQuality>
    skills: ReturnType<typeof analyzeSkillsQuality>
    links: ReturnType<typeof analyzeLinksQuality>
    gpa: ReturnType<typeof analyzeGPAQuality>
    coursework: ReturnType<typeof analyzeCourseworkQuality>
  }
}

export const WEIGHTS = {
  projects: 25,
  experience: 25,
  skills: 15,
  links: 10,
  gpa: 10,
  coursework: 15,
}

/**
 * Calculate combined score from quality and quantity
 * Quality is weighted slightly higher to encourage impact-focused content
 */
function combineScores(qualityScore: number, quantityScore: number): number {
  return Math.round(qualityScore * 0.6 + quantityScore * 0.4)
}

/**
 * Calculate comprehensive resume score with quality + quantity breakdown
 */
export function calculateResumeScoreDetailed(resume: Resume): ResumeScoreResult {
  // Analyze each category
  const projectAnalysis = analyzeProjectQuality(resume.projects)
  const experienceAnalysis = analyzeExperienceQuality(resume.experience)
  const skillsAnalysis = analyzeSkillsQuality(resume.skills)
  const linksAnalysis = analyzeLinksQuality(resume.basics)
  const gpaAnalysis = analyzeGPAQuality(resume.education?.[0]?.gpa || 0)
  const courseworkAnalysis = analyzeCourseworkQuality(resume.education)

  // Calculate combined scores
  const projectsCombined = combineScores(projectAnalysis.qualityScore, projectAnalysis.quantityScore)
  const experienceCombined = combineScores(experienceAnalysis.qualityScore, experienceAnalysis.quantityScore)
  const skillsCombined = combineScores(skillsAnalysis.qualityScore, skillsAnalysis.quantityScore)
  const linksCombined = linksAnalysis.qualityScore // Links only have quality (presence check)
  const gpaCombined = gpaAnalysis.score // GPA is threshold-based
  const courseworkCombined = combineScores(courseworkAnalysis.qualityScore, courseworkAnalysis.quantityScore)

  // Build breakdown
  const breakdown: ScoreBreakdown[] = [
    {
      category: 'Projects',
      qualityScore: projectAnalysis.qualityScore,
      quantityScore: projectAnalysis.quantityScore,
      combinedScore: projectsCombined,
      weight: WEIGHTS.projects,
      contribution: Math.round(projectsCombined * WEIGHTS.projects / 100)
    },
    {
      category: 'Experience',
      qualityScore: experienceAnalysis.qualityScore,
      quantityScore: experienceAnalysis.quantityScore,
      combinedScore: experienceCombined,
      weight: WEIGHTS.experience,
      contribution: Math.round(experienceCombined * WEIGHTS.experience / 100)
    },
    {
      category: 'Skills',
      qualityScore: skillsAnalysis.qualityScore,
      quantityScore: skillsAnalysis.quantityScore,
      combinedScore: skillsCombined,
      weight: WEIGHTS.skills,
      contribution: Math.round(skillsCombined * WEIGHTS.skills / 100)
    },
    {
      category: 'Links + Contact',
      qualityScore: linksCombined,
      quantityScore: linksCombined, // Same as quality for links
      combinedScore: linksCombined,
      weight: WEIGHTS.links,
      contribution: Math.round(linksCombined * WEIGHTS.links / 100)
    },
    {
      category: 'GPA',
      qualityScore: gpaCombined,
      quantityScore: gpaCombined, // Same as quality for GPA
      combinedScore: gpaCombined,
      weight: WEIGHTS.gpa,
      contribution: Math.round(gpaCombined * WEIGHTS.gpa / 100)
    },
    {
      category: 'Coursework',
      qualityScore: courseworkAnalysis.qualityScore,
      quantityScore: courseworkAnalysis.quantityScore,
      combinedScore: courseworkCombined,
      weight: WEIGHTS.coursework,
      contribution: Math.round(courseworkCombined * WEIGHTS.coursework / 100)
    },
  ]

  // Calculate total score
  const totalScore = breakdown.reduce((sum, item) => sum + item.contribution, 0)

  // Generate insights
  const insights = generateAllInsights(resume)

  return {
    totalScore,
    breakdown,
    insights,
    analysis: {
      projects: projectAnalysis,
      experience: experienceAnalysis,
      skills: skillsAnalysis,
      links: linksAnalysis,
      gpa: gpaAnalysis,
      coursework: courseworkAnalysis
    }
  }
}

/**
 * Calculate the overall resume score (simple version for backward compatibility)
 */
export function calculateResumeScore(resume: Resume): number {
  return calculateResumeScoreDetailed(resume).totalScore
}

/**
 * Get detailed score breakdown for display purposes
 */
export function getScoreBreakdown(resume: Resume) {
  const linksAnalysis = analyzeLinksQuality(resume.basics)

  return {
    hasGithub: linksAnalysis.hasGithub,
    hasLinkedIn: linksAnalysis.hasLinkedIn,
    hasPortfolio: linksAnalysis.hasPortfolio,
    hasProjects: Boolean(resume.projects && resume.projects.length > 0),
    hasExperience: Boolean(resume.experience && resume.experience.length > 0),
    hasCertifications: Boolean(resume.certifications && resume.certifications.length > 0),
    hasExtracurriculars: Boolean(resume.extracurriculars && resume.extracurriculars.length > 0),
  }
}

/**
 * Get score status label and styling
 */
export function getScoreStatus(score: number): {
  label: string
  color: string
  bgColor: string
} {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-600", bgColor: "bg-emerald-500" }
  if (score >= 65) return { label: "Very Good", color: "text-green-600", bgColor: "bg-green-500" }
  if (score >= 50) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-500" }
  if (score >= 35) return { label: "Fair", color: "text-amber-600", bgColor: "bg-amber-500" }
  return { label: "Needs Work", color: "text-red-600", bgColor: "bg-red-500" }
}

/**
 * Generate improvement recommendation based on score
 */
export function getImprovementMessage(score: number, breakdown: ScoreBreakdown[]): string {
  // Find the lowest scoring categories
  const sorted = [...breakdown].sort((a, b) => a.combinedScore - b.combinedScore)
  const weakest = sorted.slice(0, 2).map(b => b.category.toLowerCase())

  if (score < 50) {
    return `Focus on improving your ${weakest[0]} and ${weakest[1]}. Adding quantifiable achievements will significantly boost your score.`
  }
  if (score < 70) {
    return `You're making great progress! Consider strengthening your ${weakest[0]} section with more specific metrics and achievements.`
  }
  return "Excellent resume! Keep it updated and consider tailoring it for specific roles you're applying to."
}
