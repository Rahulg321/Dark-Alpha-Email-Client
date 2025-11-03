"use client";

import type React from "react";
import { useState } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, FileText, Sparkles, Briefcase, Heart, Edit, X } from "lucide-react";

type EmailType = "single" | "bulk";
type TemplateChoice = "template" | "custom" | "none";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const templates: Template[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Greet new users or customers with a warm welcome message",
    icon: <Heart className="h-5 w-5" />,
    category: "Onboarding",
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Share updates, news, and content with your audience",
    icon: <FileText className="h-5 w-5" />,
    category: "Marketing",
  },
  {
    id: "promotional",
    name: "Promotional",
    description: "Announce sales, offers, and special promotions",
    icon: <Sparkles className="h-5 w-5" />,
    category: "Marketing",
  },
  {
    id: "business",
    name: "Business Update",
    description: "Professional updates and business communications",
    icon: <Briefcase className="h-5 w-5" />,
    category: "Business",
  },
];

interface TemplateSelectorProps {
  emailType: EmailType;
  onBack: () => void;
  onSelect: (type: TemplateChoice, templateId?: string) => void;
}

export function TemplateSelector({ emailType, onBack, onSelect }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Select a template for your{" "}
              <span className="font-medium text-foreground">
                {emailType === "single" ? "single" : "bulk"}
              </span>{" "}
              email
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid gap-3 py-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer p-4 transition-all hover:border-primary ${
              selectedTemplate === template.id ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {template.icon}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            </div>
          </Card>
        ))}

        {/* Custom Template */}
        <Card
          className="cursor-pointer p-4 transition-all hover:border-primary"
          onClick={() => onSelect("custom")}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Edit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Custom Template</h3>
              <p className="text-sm text-muted-foreground">Create your own template from scratch</p>
            </div>
          </div>
        </Card>

        {/* No Template */}
        <Card
          className="cursor-pointer p-4 transition-all hover:border-primary"
          onClick={() => onSelect("none")}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <X className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">No Template</h3>
              <p className="text-sm text-muted-foreground">Start with a blank email</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          disabled={!selectedTemplate}
          onClick={() => selectedTemplate && onSelect("template", selectedTemplate)}
        >
          Continue with Template
        </Button>
      </div>
    </>
  );
}
