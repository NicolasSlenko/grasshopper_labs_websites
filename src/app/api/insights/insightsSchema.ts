import { z } from "zod"

export const actionableInsightSchema = z.object({
    id: z.string(),
    category: z.enum(['projects', 'experience', 'skills', 'gpa', 'coursework', 'links']),
    insight: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    checked: z.boolean(),
})

export const userInsightsSchema = z.object({
    insights: z.array(actionableInsightSchema),
    generatedAt: z.string(),
    lastUpdatedAt: z.string(),
})

export type ActionableInsight = z.infer<typeof actionableInsightSchema>
export type UserInsights = z.infer<typeof userInsightsSchema>
