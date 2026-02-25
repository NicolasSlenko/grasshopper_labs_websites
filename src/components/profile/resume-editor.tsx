"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import ResumeSchema, { type Resume } from "@/app/api/parse/resumeSchema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Trash2, Wand2, Save } from "lucide-react"
import { toast } from "sonner"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { XYZFeedbackDialog } from "@/components/xyz-feedback-dialog"

interface ResumeEditorProps {
    initialData: Resume
    onSave: (data: Resume) => Promise<void>
}



export function ResumeEditor({ initialData, onSave }: ResumeEditorProps) {
    const [isSaving, setIsSaving] = useState(false)
    const form = useForm<Resume>({
        resolver: zodResolver(ResumeSchema),
        defaultValues: initialData,
    })

    // Arrays
    const { fields: educationFields, append: appendEdu, remove: removeEdu } = useFieldArray({
        control: form.control,
        name: "education",
    })
    const { fields: experienceFields, append: appendExp, remove: removeExp } = useFieldArray({
        control: form.control,
        name: "experience",
    })
    const { fields: projectFields, append: appendProj, remove: removeProj } = useFieldArray({
        control: form.control,
        name: "projects",
    })

    const onSubmit = async (data: Resume) => {
        setIsSaving(true)
        try {
            await onSave(data)
            toast.success("Resume updated successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save resume")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basics Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Edit your contact details</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input {...form.register("basics.name")} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input {...form.register("basics.email")} placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input {...form.register("basics.phone")} placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input {...form.register("basics.location.city")} placeholder="City" />
                            <Input {...form.register("basics.location.state")} placeholder="State" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>LinkedIn</Label>
                        <Input {...form.register("basics.linkedin")} placeholder="linkedin.com/in/..." />
                    </div>
                    <div className="space-y-2">
                        <Label>Portfolio/Website</Label>
                        <Input {...form.register("basics.portfolio")} placeholder="portfolio.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>GitHub</Label>
                        <Input {...form.register("basics.github")} placeholder="github.com/..." />
                    </div>
                </CardContent>
            </Card>

            {/* Experience Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Experience</CardTitle>
                        <CardDescription>Work history and internships</CardDescription>
                    </div>
                    <Button type="button" size="sm" onClick={() => appendExp({
                        company: "", position: "", start_date: "", end_date: "", location: "",
                        responsibilities: [], achievements: [], technologies: []
                    })}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {experienceFields.map((field, index) => (
                            <AccordionItem key={field.id} value={field.id}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex justify-between w-full pr-4">
                                        <span className="font-semibold">
                                            {form.watch(`experience.${index}.company`) || "New Position"}
                                            <span className="font-normal text-muted-foreground ml-2">
                                                {form.watch(`experience.${index}.position`)}
                                            </span>
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 p-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Company</Label>
                                            <Input {...form.register(`experience.${index}.company`)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Position</Label>
                                            <Input {...form.register(`experience.${index}.position`)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input {...form.register(`experience.${index}.start_date`)} placeholder="YYYY-MM" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input {...form.register(`experience.${index}.end_date`)} placeholder="YYYY-MM or Present" />
                                        </div>
                                    </div>

                                    {/* Responsibilities / Description */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>Responsibilities (Bulleted)</Label>
                                        </div>
                                        {/* 
                           We can't easily map array to inputs without sub-field-array. 
                           For simplicity in this "Big Editor", we might map to a Textarea 
                           and parse newlines, or just show first few.
                           But to support XYZ analysis, we really want to analyze Specific Bullets.
                           Let's simplify: Edit responsibilities as a list of strings is hard.
                           Let's assume we edit specific responsibilities or just one big text block that gets split?
                           Schema says `responsibilities: string[]`.
                           Lets use a Textarea that joins by newline for editing, and splits on submit is cleaner UI but complex logic.
                           OR, just list the first 5 inputs.
                        */}
                                        <div className="space-y-2">
                                            {/* Simple hack: Limit to 5 bullets editing for now or use field array if needed.
                                Better: Just show specific index 0 or 'Summary'.
                                Actually, checking schema, it's array.
                                Let's just create a Helper component for string arrays?
                                User wants "tailored feedback for EACH project and experience".
                                Ideally we analyze the WHOLE description.
                            */}
                                            <Textarea
                                                placeholder="Enter responsibilities..."
                                                className="min-h-[100px]"
                                                defaultValue={form.watch(`experience.${index}.responsibilities`)?.join('\n')}
                                                onChange={(e) => {
                                                    form.setValue(`experience.${index}.responsibilities`, e.target.value.split('\n').filter(s => s.trim() !== ""))
                                                }}
                                            />
                                            <div className="flex justify-end">
                                                {/* Pass the joined text for analysis */}
                                                <XYZFeedbackDialog text={form.watch(`experience.${index}.responsibilities`)?.join('\n') || ""} type="experience" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button variant="destructive" size="sm" type="button" onClick={() => removeExp(index)}>
                                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* Projects Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Projects</CardTitle>
                        <CardDescription>Academic and personal projects</CardDescription>
                    </div>
                    <Button type="button" size="sm" onClick={() => appendProj({
                        name: "", description: "", technologies: [], highlights: [], link: "", github: ""
                    })}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {projectFields.map((field, index) => (
                            <AccordionItem key={field.id} value={field.id}>
                                <AccordionTrigger className="hover:no-underline">
                                    <span className="font-semibold">
                                        {form.watch(`projects.${index}.name`) || "New Project"}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 p-2">
                                    <div className="space-y-2">
                                        <Label>Project Name</Label>
                                        <Input {...form.register(`projects.${index}.name`)} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label>Description</Label>
                                            <XYZFeedbackDialog text={[form.watch(`projects.${index}.description`) || "", ...(form.watch(`projects.${index}.highlights`) || [])].filter(Boolean).join('\n')} type="project" />
                                        </div>
                                        <Textarea {...form.register(`projects.${index}.description`)} className="min-h-[60px]" placeholder="Brief project summary..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bullet Points / Highlights</Label>
                                        <Textarea
                                            placeholder="Enter bullet points (one per line)..."
                                            className="min-h-[120px]"
                                            defaultValue={form.watch(`projects.${index}.highlights`)?.join('\n')}
                                            onChange={(e) => {
                                                form.setValue(`projects.${index}.highlights`, e.target.value.split('\n').filter(s => s.trim() !== ""))
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button variant="destructive" size="sm" type="button" onClick={() => removeProj(index)}>
                                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end sticky bottom-4 bg-background p-4 border-t shadow-lg rounded-tl-lg rounded-tr-lg">
                <Button type="submit" size="lg" disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                </Button>
            </div>
        </form>
    )
}
