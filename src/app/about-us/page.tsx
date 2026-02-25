"use client"

import { TeamMemberCard } from "@/components/team-member-card"
import { Badge } from "@/components/ui/badge"

export default function AboutUsPage() {
  const students = [
    {
      name: "Wyatt Harris",
      role: "Full Stack Architect",
      description: "Building scalable systems and crafting seamless user experiences. Specializes in Next.js and Cloud Infrastructure.",
      socials: { github: "#", linkedin: "#", email: "wyatt@example.com" }
    },
    {
      name: "Jason Tolen",
      role: "UI/UX Designer",
      description: "Designing improved interfaces for the next generation of web apps. Passionate about accessibility and design systems.",
      socials: { github: "#", linkedin: "#", email: "jason@example.com" }
    },
    {
      name: "Nicolas Slenko",
      role: "Backend Engineer",
      description: "Optimizing database queries and ensuring system reliability. Expert in SQL and distributed systems.",
      socials: { github: "#", linkedin: "#", email: "nicolas@example.com" }
    },
    {
      name: "Oliver",
      role: "Data Scientist",
      description: "Uncovering insights from massive datasets. Focused on machine learning and predictive analytics.",
      socials: { github: "#", linkedin: "#", email: "oliver@example.com" }
    }
  ]

  const professor = {
    name: "Dr. Amanpreet Kapoor",
    role: "Research Lead & Professor",
    description: "Guiding the next generation of tech leaders. Specializing in AI and Human-Computer Interaction.",
    socials: { github: "#", linkedin: "#", email: "kapoor@ufl.edu" },
    isProfessor: true
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4">
            The Team
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Meet the Builders
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We are a group of passionate developers, designers, and researchers building the future of career progression.
          </p>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {students.map((student, idx) => (
            <TeamMemberCard key={idx} {...student} />
          ))}
        </div>

        {/* Professor Section */}
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
             <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
               Faculty Advisor
             </span>
          </div>
          <TeamMemberCard {...professor} />
        </div>
      </div>
    </div>
  )
}
