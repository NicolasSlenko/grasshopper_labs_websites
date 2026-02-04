"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { 
  TrendingUp, Target, Code, Cpu, Award, GraduationCap, 
  FolderKanban, Building2, Database, Briefcase 
} from "lucide-react"
import { GPAProgressBar } from "@/components/gpa-progress-bar"
import { YearInSchoolIndicator } from "@/components/year-in-school-indicator"
import { SkillsRadarChart } from "@/components/skills-radar-chart"
import { TechStackAlignment } from "@/components/tech-stack-alignment"
import { ProjectPortfolioCounter } from "@/components/project-portfolio-counter"
import { ResumeCompletenessScore } from "@/components/resume-completeness-score"
import { InternshipCounter } from "@/components/internship-counter"
import { RoleSkillsMatch } from "@/components/role-skills-match"
import { CareerPathCourseworkChart } from "@/components/career-path-radar"

// Mock data - replace with actual resume data later
const mockStudentData = {
  gpa: 3.7,
  yearInSchool: 3,
  internshipCount: 1,
  projectCount: 4,
  skills: {
    programmingLanguages: ["JavaScript", "Python", "TypeScript", "Java"],
    frameworks: ["React", "Next.js", "Node.js", "Express"],
    databases: ["PostgreSQL", "MongoDB"],
    devops: ["Docker", "Git"],
    certifications: [],
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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overall")

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Your personalized insights and recommendations</p>
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
            <Accordion type="multiple" className="space-y-4" defaultValue={["skills-overview", "tech-overview", "resume-overview"]}>
              <AccordionItem value="skills-overview" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Skills Portfolio (Spider Web)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <SkillsRadarChart skills={mockStudentData.skills} />
                </AccordionContent>
              </AccordionItem>

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

              <AccordionItem value="resume-overview" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Resume Completeness</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ResumeCompletenessScore resume={mockStudentData.resume} />
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
                  <GPAProgressBar gpa={mockStudentData.gpa} />
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
                  <YearInSchoolIndicator currentYear={mockStudentData.yearInSchool} />
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
                  <SkillsRadarChart skills={mockStudentData.skills} />
                </AccordionContent>
              </AccordionItem>

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
                  <ProjectPortfolioCounter projectCount={mockStudentData.projectCount} />
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
                  <ResumeCompletenessScore resume={mockStudentData.resume} />
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
                  <InternshipCounter internshipCount={mockStudentData.internshipCount} />
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
                  <RoleSkillsMatch skills={mockStudentData.skills} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
