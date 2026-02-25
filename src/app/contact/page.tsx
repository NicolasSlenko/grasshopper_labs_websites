"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, MessageSquare, Send, User } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          
          {/* Info Section */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                Get in Touch
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Have questions about the project? Want to collaborate or report an issue? 
                We'd love to hear from you.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Email Us</p>
                  <a href="mailto:contact@grasshopper.edu" className="text-lg hover:text-primary transition-colors">contact@grasshopper.edu</a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Join the Community</p>
                  <a href="#" className="text-lg hover:text-primary transition-colors">discord.gg/resumehub</a>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input id="name" placeholder="Your name" />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input id="email" type="email" placeholder="name@example.com" />
                </div>

                 <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">Message</label>
                  <Textarea 
                    id="message" 
                    placeholder="How can we help?" 
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
