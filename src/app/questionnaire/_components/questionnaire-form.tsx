"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { questionnaireSchema, questionnaireOptions, type QuestionnaireData } from "../data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const steps = [
  { id: "techSectors", title: "Tech Sectors", description: "What tech sectors interest you?" },
  { id: "roleTypes", title: "Role Types", description: "What roles are you interested in?" },
  { id: "workEnvironment", title: "Work Environment", description: "What's your preferred work setup?" },
  { id: "companySize", title: "Company Size", description: "What company size do you prefer?" },
  { id: "experienceLevel", title: "Experience Level", description: "What's your experience level?" },
  { id: "workSchedule", title: "Work Schedule", description: "What schedule works best for you?" },
  { id: "technicalSkills", title: "Technical Skills", description: "What are your technical skills?" },
  { id: "location", title: "Location", description: "Where do you want to work?" },
  { id: "salaryExpectations", title: "Salary", description: "What's your salary expectation?" },
]

interface QuestionnaireFormProps {
  initialData: QuestionnaireData | null
}

export default function QuestionnaireForm({ initialData }: QuestionnaireFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [jsonOutput, setJsonOutput] = useState<QuestionnaireData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const defaultValues: QuestionnaireData = initialData ?? {
    techSectors: [],
    roleTypes: [],
    workEnvironment: [],
    companySize: [],
    experienceLevel: [],
    workSchedule: [],
    technicalSkills: [],
    location: [],
    salaryExpectations: [],
  }

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionnaireData>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues,
  })

  const currentStepId = steps[currentStep].id as keyof QuestionnaireData
  const currentValues = watch(currentStepId)
  const currentError = errors[currentStepId]
  const isLastStep = currentStep === steps.length - 1

  const toggleOption = (option: string) => {
    const current = currentValues || []
    const updated = current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
    setValue(currentStepId, updated, { shouldValidate: true })
  }

  const autoFillAndSubmit = () => {
    if (isSaving) return
    // Auto-select the first option for each step
    steps.forEach((step) => {
      const stepId = step.id as keyof QuestionnaireData
      const options = questionnaireOptions[stepId]
      if (options && options.length > 0) {
        setValue(stepId, [options[0]], { shouldValidate: true })
      }
    })
    
    // Trigger form submission after a brief delay to ensure values are set
    setTimeout(() => {
      handleSubmit(onSubmit)()
    }, 100)
  }

  const canProceed = () => {
    return currentValues && currentValues.length > 0
  }

  const handleNext = () => {
    if (isSaving) return
    if (canProceed()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit(onSubmit)()
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: QuestionnaireData) => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result?.error || "Failed to save preferences")
      }

      setJsonOutput(data)
      setIsComplete(true)
      toast.success("Preferences saved to your profile!")
    } catch (error) {
      console.error("Error saving questionnaire:", error)
      const message = error instanceof Error ? error.message : "Failed to save preferences"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isComplete && jsonOutput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="size-16 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Questionnaire Complete!</CardTitle>
            <CardDescription>Your preferences are safely stored. Here&apos;s your JSON output.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px]">
              <pre className="text-sm font-mono">{JSON.stringify(jsonOutput, null, 2)}</pre>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1"
              >
                View Dashboard
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(jsonOutput, null, 2))
                }}
                variant="secondary"
                className="flex-1"
              >
                Copy JSON
              </Button>
              <Button
                onClick={() => {
                  setIsComplete(false)
                  setCurrentStep(0)
                  setJsonOutput(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {questionnaireOptions[currentStepId].map((option) => (
              <div
                key={option}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-muted/50",
                  currentValues?.includes(option) ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <Checkbox
                  id={option}
                  checked={currentValues?.includes(option)}
                  onCheckedChange={() => toggleOption(option)}
                  className="mt-0.5"
                />
                <Label htmlFor={option} className="flex-1 cursor-pointer font-normal leading-relaxed">
                  {option}
                </Label>
              </div>
            ))}
          </div>

          {currentError && <p className="text-sm text-destructive">{currentError.message}</p>}

          <div className="space-y-3 pt-4">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex-1 bg-transparent"
              >
                <ChevronLeft className="size-4 mr-2" />
                Previous
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || (isLastStep && isSaving)}
                className="flex-1"
              >
                {isLastStep ? (isSaving ? "Saving..." : "Complete") : "Next"}
                {!isLastStep && <ChevronRight className="size-4 ml-2" />}
              </Button>
            </div>
            
            <Button
              type="button"
              variant="secondary"
              onClick={autoFillAndSubmit}
              className="w-full"
              disabled={isSaving}
            >
              Auto-fill & Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
