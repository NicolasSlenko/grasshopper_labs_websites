import type { Resume } from "@/app/api/parse/resumeSchema"

/**
 * Quality Analysis Module
 * Analyzes resume content for quality indicators like quantifiable impact,
 * action verbs, and technical depth.
 */

// Keywords that indicate quantifiable impact
const IMPACT_PATTERNS = [
  /\d+%/,                           // Percentages
  /\$[\d,]+/,                       // Dollar amounts
  /\d+[x×]/i,                       // Multipliers (2x, 10x)
  /\d+\+?\s*(users|customers|clients|members)/i,  // User counts
  /\d+\s*(ms|seconds|minutes|hours|days)/i,       // Time improvements
  /\d+\s*(requests|queries|transactions)/i,       // Volume metrics
  /increased|decreased|improved|reduced|boosted|grew|saved/i, // Action verbs with likely numbers
]

// Strong action verbs that indicate leadership/initiative
const ACTION_VERBS = [
  'led', 'managed', 'architected', 'designed', 'implemented', 'built',
  'launched', 'deployed', 'optimized', 'scaled', 'mentored', 'coordinated',
  'spearheaded', 'pioneered', 'established', 'transformed', 'automated',
  'streamlined', 'developed', 'created', 'engineered', 'delivered'
]

// Technical depth indicators
const TECHNICAL_KEYWORDS = [
  'api', 'microservices', 'database', 'algorithm', 'architecture',
  'infrastructure', 'ci/cd', 'deployment', 'testing', 'security',
  'scalability', 'performance', 'optimization', 'integration', 'migration'
]

/**
 * Analyze text for quality indicators
 */
function analyzeTextQuality(text: string): {
  hasQuantifiableImpact: boolean
  impactScore: number
  hasActionVerbs: boolean
  actionVerbScore: number
  hasTechnicalDepth: boolean
  technicalScore: number
} {
  const textLower = text.toLowerCase()
  
  // Check for quantifiable impact patterns
  const impactMatches = IMPACT_PATTERNS.filter(pattern => pattern.test(text))
  const hasQuantifiableImpact = impactMatches.length > 0
  const impactScore = Math.min(impactMatches.length * 20, 100)
  
  // Check for action verbs
  const actionVerbMatches = ACTION_VERBS.filter(verb => 
    new RegExp(`\\b${verb}\\b`, 'i').test(textLower)
  )
  const hasActionVerbs = actionVerbMatches.length > 0
  const actionVerbScore = Math.min(actionVerbMatches.length * 15, 100)
  
  // Check for technical depth
  const technicalMatches = TECHNICAL_KEYWORDS.filter(keyword =>
    textLower.includes(keyword)
  )
  const hasTechnicalDepth = technicalMatches.length > 0
  const technicalScore = Math.min(technicalMatches.length * 12, 100)
  
  return {
    hasQuantifiableImpact,
    impactScore,
    hasActionVerbs,
    actionVerbScore,
    hasTechnicalDepth,
    technicalScore
  }
}

/**
 * Analyze project quality
 */
export function analyzeProjectQuality(projects: Resume['projects']): {
  qualityScore: number
  quantityScore: number
  insights: string[]
} {
  if (!projects || projects.length === 0) {
    return {
      qualityScore: 0,
      quantityScore: 0,
      insights: ['Add projects to showcase your hands-on experience']
    }
  }

  const insights: string[] = []
  let totalQualityScore = 0
  
  // Quantity score: based on number of projects (max at 4+ projects)
  const quantityScore = Math.min(projects.length * 25, 100)
  
  // Analyze each project for quality
  for (const project of projects) {
    const projectText = [
      project.description,
      ...project.highlights,
    ].join(' ')
    
    const analysis = analyzeTextQuality(projectText)
    
    // Calculate quality score for this project
    let projectQuality = 0
    projectQuality += analysis.impactScore * 0.4
    projectQuality += analysis.actionVerbScore * 0.3
    projectQuality += analysis.technicalScore * 0.3
    
    // Bonus for having technologies listed
    if (project.technologies && project.technologies.length > 0) {
      projectQuality += Math.min(project.technologies.length * 5, 20)
    }
    
    totalQualityScore += Math.min(projectQuality, 100)
    
    // Generate insights for low-quality projects
    if (!analysis.hasQuantifiableImpact) {
      insights.push(`Add metrics to "${project.name}" (e.g., "improved load time by 40%")`)
    }
  }
  
  const qualityScore = Math.round(totalQualityScore / projects.length)
  
  if (projects.length < 3) {
    insights.push('Add more projects to demonstrate breadth of experience')
  }
  
  return {
    qualityScore: Math.min(qualityScore, 100),
    quantityScore,
    insights: insights.slice(0, 3) // Limit to top 3 insights
  }
}

/**
 * Analyze experience quality (internships, research, TA, jobs)
 */
export function analyzeExperienceQuality(experience: Resume['experience']): {
  qualityScore: number
  quantityScore: number
  insights: string[]
  breakdown: {
    internships: number
    research: number
    teaching: number
    other: number
  }
} {
  if (!experience || experience.length === 0) {
    return {
      qualityScore: 0,
      quantityScore: 0,
      insights: ['Gain experience through internships, research, or TA positions'],
      breakdown: { internships: 0, research: 0, teaching: 0, other: 0 }
    }
  }

  const insights: string[] = []
  let totalQualityScore = 0
  
  // Categorize experience
  const breakdown = { internships: 0, research: 0, teaching: 0, other: 0 }
  
  for (const exp of experience) {
    const positionLower = exp.position.toLowerCase()
    if (positionLower.includes('intern')) breakdown.internships++
    else if (positionLower.includes('research') || positionLower.includes('researcher')) breakdown.research++
    else if (positionLower.includes('ta') || positionLower.includes('teaching') || positionLower.includes('tutor')) breakdown.teaching++
    else breakdown.other++
  }
  
  // Quantity score: based on total experience count
  const totalExp = experience.length
  const quantityScore = Math.min(totalExp * 30, 100)
  
  // Analyze each experience for quality
  for (const exp of experience) {
    const expText = [
      ...exp.responsibilities,
      ...exp.achievements,
    ].join(' ')
    
    const analysis = analyzeTextQuality(expText)
    
    // Calculate quality score for this experience
    let expQuality = 0
    expQuality += analysis.impactScore * 0.45
    expQuality += analysis.actionVerbScore * 0.35
    expQuality += analysis.technicalScore * 0.2
    
    // Bonus for having achievements (not just responsibilities)
    if (exp.achievements && exp.achievements.length > 0) {
      expQuality += 15
    }
    
    totalQualityScore += Math.min(expQuality, 100)
    
    // Generate insights
    if (!analysis.hasQuantifiableImpact && exp.achievements.length === 0) {
      insights.push(`Add measurable achievements to your ${exp.position} role`)
    }
  }
  
  const qualityScore = Math.round(totalQualityScore / experience.length)
  
  // Diversity bonus insight
  const categories = Object.values(breakdown).filter(v => v > 0).length
  if (categories < 2) {
    insights.push('Diversify your experience with research, TA, or different role types')
  }
  
  return {
    qualityScore: Math.min(qualityScore, 100),
    quantityScore,
    insights: insights.slice(0, 3),
    breakdown
  }
}

/**
 * Analyze skills quality and coverage
 */
export function analyzeSkillsQuality(skills: Resume['skills']): {
  qualityScore: number
  quantityScore: number
  insights: string[]
  coverage: {
    languages: number
    frameworks: number
    databases: number
    devops: number
    other: number
  }
} {
  if (!skills) {
    return {
      qualityScore: 0,
      quantityScore: 0,
      insights: ['Add technical skills to your resume'],
      coverage: { languages: 0, frameworks: 0, databases: 0, devops: 0, other: 0 }
    }
  }

  const insights: string[] = []
  
  const coverage = {
    languages: skills.programming_languages?.length || 0,
    frameworks: skills.frameworks?.length || 0,
    databases: skills.databases?.length || 0,
    devops: skills.devops_tools?.length || 0,
    other: skills.other?.length || 0,
  }
  
  const totalSkills = Object.values(coverage).reduce((a, b) => a + b, 0)
  const categoriesCovered = Object.values(coverage).filter(v => v > 0).length
  
  // Quantity score: based on total skills count
  const quantityScore = Math.min(totalSkills * 5, 100)
  
  // Quality score: based on category coverage (well-rounded skills)
  const coverageScore = (categoriesCovered / 5) * 100
  
  // Bonus for having good depth in each category
  let depthScore = 0
  for (const [category, count] of Object.entries(coverage)) {
    if (count >= 3) depthScore += 20
    else if (count >= 2) depthScore += 10
    else if (count >= 1) depthScore += 5
  }
  
  const qualityScore = Math.round((coverageScore * 0.6) + (Math.min(depthScore, 100) * 0.4))
  
  // Generate insights
  if (coverage.languages === 0) insights.push('Add programming languages you know')
  if (coverage.frameworks === 0) insights.push('List frameworks you have worked with')
  if (coverage.devops === 0) insights.push('Add DevOps/cloud tools (Docker, AWS, etc.)')
  if (coverage.databases === 0) insights.push('Include databases you have experience with')
  
  return {
    qualityScore: Math.min(qualityScore, 100),
    quantityScore,
    insights: insights.slice(0, 3),
    coverage
  }
}

/**
 * Analyze links and contact information
 */
export function analyzeLinksQuality(basics: Resume['basics']): {
  qualityScore: number
  insights: string[]
  hasGithub: boolean
  hasLinkedIn: boolean
  hasPortfolio: boolean
  hasEmail: boolean
  hasPhone: boolean
} {
  const hasGithub = Boolean(basics?.github?.trim())
  const hasLinkedIn = Boolean(basics?.linkedin?.trim())
  const hasPortfolio = Boolean(basics?.portfolio?.trim())
  const hasEmail = Boolean(basics?.email?.trim())
  const hasPhone = Boolean(basics?.phone?.trim())
  
  const insights: string[] = []
  let score = 0
  
  // Score each link/contact
  if (hasGithub) score += 25
  else insights.push('Add your GitHub profile to showcase your code')
  
  if (hasLinkedIn) score += 20
  else insights.push('Add your LinkedIn profile for networking')
  
  if (hasPortfolio) score += 25
  else insights.push('Create a portfolio website to stand out')
  
  if (hasEmail) score += 15
  if (hasPhone) score += 15
  
  return {
    qualityScore: score,
    insights: insights.slice(0, 3),
    hasGithub,
    hasLinkedIn,
    hasPortfolio,
    hasEmail,
    hasPhone
  }
}

/**
 * Analyze GPA with threshold-based scoring
 */
export function analyzeGPAQuality(gpa: number): {
  score: number
  tier: 'excellent' | 'good' | 'fair' | 'needs_improvement' | 'not_provided'
  insights: string[]
} {
  if (!gpa || gpa === 0) {
    return {
      score: 0,
      tier: 'not_provided',
      insights: ['Include your GPA if it is 3.0 or above']
    }
  }
  
  // Threshold-based scoring
  if (gpa >= 3.7) {
    return {
      score: 100,
      tier: 'excellent',
      insights: ['Your GPA is excellent - highlight it prominently!']
    }
  }
  if (gpa >= 3.3) {
    return {
      score: 80,
      tier: 'good',
      insights: ['Your GPA is competitive for most roles']
    }
  }
  if (gpa >= 3.0) {
    return {
      score: 60,
      tier: 'fair',
      insights: ['Focus on projects and experience to supplement your GPA']
    }
  }
  
  return {
    score: 40,
    tier: 'needs_improvement',
    insights: ['Emphasize skills and projects over GPA in applications']
  }
}

/**
 * Analyze coursework quality
 */
export function analyzeCourseworkQuality(education: Resume['education']): {
  qualityScore: number
  quantityScore: number
  insights: string[]
} {
  const achievements = education?.[0]?.achievements || []
  
  if (achievements.length === 0) {
    return {
      qualityScore: 0,
      quantityScore: 0,
      insights: ['Add relevant coursework or academic achievements']
    }
  }
  
  const insights: string[] = []
  
  // Quantity: number of courses/achievements listed
  const quantityScore = Math.min(achievements.length * 20, 100)
  
  // Quality: analyze course relevance (simple keyword matching for now)
  const relevantKeywords = [
    'data structures', 'algorithms', 'machine learning', 'database',
    'operating systems', 'networks', 'security', 'software engineering',
    'artificial intelligence', 'computer vision', 'distributed systems'
  ]
  
  let relevanceCount = 0
  for (const achievement of achievements) {
    const lower = achievement.toLowerCase()
    if (relevantKeywords.some(kw => lower.includes(kw))) {
      relevanceCount++
    }
  }
  
  const qualityScore = achievements.length > 0 
    ? Math.round((relevanceCount / achievements.length) * 100)
    : 0
  
  if (achievements.length < 5) {
    insights.push('Add more relevant technical coursework')
  }
  
  return {
    qualityScore,
    quantityScore,
    insights: insights.slice(0, 3)
  }
}

/**
 * Generate all actionable insights from resume analysis
 */
export interface ActionableInsight {
  id: string
  category: 'projects' | 'experience' | 'skills' | 'gpa' | 'coursework' | 'links'
  insight: string
  priority: 'high' | 'medium' | 'low'
  checked: boolean
}

export function generateAllInsights(resume: Resume): ActionableInsight[] {
  const insights: ActionableInsight[] = []
  let idCounter = 0
  
  const generateId = () => `insight_${++idCounter}`
  
  // Prioritize insights based on score impact
  const projectAnalysis = analyzeProjectQuality(resume.projects)
  for (const insight of projectAnalysis.insights) {
    insights.push({
      id: generateId(),
      category: 'projects',
      insight,
      priority: projectAnalysis.qualityScore < 50 ? 'high' : 'medium',
      checked: false
    })
  }
  
  const experienceAnalysis = analyzeExperienceQuality(resume.experience)
  for (const insight of experienceAnalysis.insights) {
    insights.push({
      id: generateId(),
      category: 'experience',
      insight,
      priority: experienceAnalysis.qualityScore < 50 ? 'high' : 'medium',
      checked: false
    })
  }
  
  const skillsAnalysis = analyzeSkillsQuality(resume.skills)
  for (const insight of skillsAnalysis.insights) {
    insights.push({
      id: generateId(),
      category: 'skills',
      insight,
      priority: skillsAnalysis.quantityScore < 30 ? 'high' : 'low',
      checked: false
    })
  }
  
  const linksAnalysis = analyzeLinksQuality(resume.basics)
  for (const insight of linksAnalysis.insights) {
    insights.push({
      id: generateId(),
      category: 'links',
      insight,
      priority: 'medium',
      checked: false
    })
  }
  
  const gpaAnalysis = analyzeGPAQuality(resume.education?.[0]?.gpa || 0)
  for (const insight of gpaAnalysis.insights) {
    insights.push({
      id: generateId(),
      category: 'gpa',
      insight,
      priority: 'low',
      checked: false
    })
  }
  
  const courseworkAnalysis = analyzeCourseworkQuality(resume.education)
  for (const insight of courseworkAnalysis.insights) {
    insights.push({
      id: generateId(),
      category: 'coursework',
      insight,
      priority: 'low',
      checked: false
    })
  }
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  
  return insights
}
