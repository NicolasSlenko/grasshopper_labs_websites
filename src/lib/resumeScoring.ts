import type { Resume } from "@/app/api/parse/resumeSchema"

/**
 * Calculate the overall resume score based on parsed resume data.
 * This uses the SAME calculation as the dashboard's OverallResumeScore component.
 * 
 * Weights:
 * - Coursework: 5%
 * - Skills: 20%
 * - Resume Completeness: 15%
 * - GPA: 15%
 * - Projects: 25%
 * - Internships: 20%
 */
export function calculateResumeScore(resume: Resume): number {
  const WEIGHTS = {
    coursework: 5,
    skills: 20,
    resumeCompleteness: 15,
    gpa: 15,
    projects: 25,
    internships: 20,
  }

  // 1. Coursework Score - simplified (based on education achievements)
  const courseworkScore = Math.min((resume.education?.[0]?.achievements?.length || 0) * 20, 100)

  // 2. Skills Portfolio Score
  const calculateSkillsScore = (): number => {
    const skills = resume.skills
    if (!skills) return 0
    
    const counts = {
      languages: skills.programming_languages?.length || 0,
      frameworks: skills.frameworks?.length || 0,
      databases: skills.databases?.length || 0,
      devops: skills.devops_tools?.length || 0,
      other: skills.other?.length || 0,
    }
    
    const coveredCategories = Object.values(counts).filter(c => c > 0).length
    const coverageScore = (coveredCategories / 5) * 50
    
    const totalSkills = Object.values(counts).reduce((a, b) => a + b, 0)
    const countScore = Math.min(totalSkills * 3, 50)
    
    return Math.round(coverageScore + countScore)
  }
  const skillsScore = calculateSkillsScore()

  // 3. Resume Completeness Score
  const calculateCompletenessScore = (): number => {
    let score = 0
    if (resume.basics?.github && resume.basics.github.trim() !== "") score += 15
    if (resume.basics?.linkedin && resume.basics.linkedin.trim() !== "") score += 10
    if (resume.basics?.portfolio && resume.basics.portfolio.trim() !== "") score += 15
    if (resume.projects && resume.projects.length > 0) score += 20
    if (resume.experience && resume.experience.length > 0) score += 20
    if (resume.certifications && resume.certifications.length > 0) score += 10
    if (resume.extracurriculars && resume.extracurriculars.length > 0) score += 10
    return score
  }
  const completenessScore = calculateCompletenessScore()

  // 4. GPA Score (scaled from 2.5-4.0 range to 0-100)
  const calculateGpaScore = (): number => {
    const gpa = resume.education?.[0]?.gpa || 0
    if (gpa === 0) return 0
    const MIN_GPA = 2.5
    const MAX_GPA = 4.0
    const normalized = Math.max(0, Math.min(1, (gpa - MIN_GPA) / (MAX_GPA - MIN_GPA)))
    return Math.round(normalized * 100)
  }
  const gpaScore = calculateGpaScore()

  // 5. Project Portfolio Score
  const calculateProjectScore = (): number => {
    const projects = resume.projects || []
    if (projects.length === 0) return 0
    
    const categorizeProject = (tech: string[]): string => {
      const techLower = tech.map(t => t.toLowerCase())
      if (techLower.some(t => t.includes('react native') || t.includes('flutter') || t.includes('swift') || t.includes('kotlin'))) return 'Mobile'
      if (techLower.some(t => t.includes('tensorflow') || t.includes('pytorch') || t.includes('pandas') || t.includes('machine learning'))) return 'Data/ML'
      if (techLower.some(t => t.includes('react') || t.includes('vue') || t.includes('angular') || t.includes('next') || t.includes('node'))) return 'Web'
      return 'Other'
    }

    const categories = new Set(projects.map(p => categorizeProject(p.technologies || [])))
    const diversity = categories.size
    
    let score = Math.min(projects.length * 10, 40)
    score += Math.min(diversity * 10, 20)
    score += 20 // Default relevance bonus (no questionnaire data available server-side)
    
    return Math.min(score, 100)
  }
  const projectScore = calculateProjectScore()

  // 6. Internship Score
  const calculateInternshipScore = (): number => {
    const experiences = resume.experience || []
    const internships = experiences.filter(exp => 
      exp.position.toLowerCase().includes('intern')
    )
    if (internships.length === 0) return 0
    
    let score = Math.min(internships.length * 35, 70)
    score += 15 // Default relevance bonus
    
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

  return totalScore
}

/**
 * Get detailed score breakdown for display purposes
 */
export function getScoreBreakdown(resume: Resume) {
  return {
    hasGithub: Boolean(resume.basics?.github && resume.basics.github.trim() !== ""),
    hasLinkedIn: Boolean(resume.basics?.linkedin && resume.basics.linkedin.trim() !== ""),
    hasPortfolio: Boolean(resume.basics?.portfolio && resume.basics.portfolio.trim() !== ""),
    hasProjects: Boolean(resume.projects && resume.projects.length > 0),
    hasExperience: Boolean(resume.experience && resume.experience.length > 0),
    hasCertifications: Boolean(resume.certifications && resume.certifications.length > 0),
    hasExtracurriculars: Boolean(resume.extracurriculars && resume.extracurriculars.length > 0),
  }
}
