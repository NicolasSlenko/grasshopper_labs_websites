"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Linkedin, Mail, GraduationCap, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

interface TeamMemberProps {
  name: string
  role: string
  description: string
  image?: string
  socials?: {
    github?: string
    linkedin?: string
    email?: string
  }
  stats?: {
    label: string
    value: string
  }[]
  isProfessor?: boolean
}

export function TeamMemberCard({ 
  name, 
  role, 
  description, 
  image, 
  socials,
  isProfessor = false
}: TeamMemberProps) {
  return (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 border-border bg-card">
      {/* Header Image / Color Block */}
      <div className={cn(
        "h-32 w-full relative",
        isProfessor ? "bg-amber-100/50 dark:bg-amber-950/30" : "bg-primary/10"
      )}>
        {/* Avatar Area */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-background shadow-md overflow-hidden bg-muted flex items-center justify-center">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {name.split(' ').map(n => n[0]).join('')}
              </span>
            )}
          </div>
        </div>
      </div>

      <CardContent className="pt-16 pb-6 px-6 text-center">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-1">{name}</h3>
          <Badge variant="secondary" className="mb-2">
            {isProfessor ? <Briefcase className="w-3 h-3 mr-1" /> : <GraduationCap className="w-3 h-3 mr-1" />}
            {role}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex justify-center gap-3">
          {socials?.github && (
            <a href={socials.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-4 h-4" />
            </a>
          )}
          {socials?.linkedin && (
            <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
          )}
          {socials?.email && (
            <a href={`mailto:${socials.email}`} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

