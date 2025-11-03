"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Users } from "lucide-react";
import { TemplateSelector } from "@/app/components/template-selector";
import { useRouter } from "next/navigation";

type EmailType = "single" | "bulk" | null;

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeDialog({ open, onOpenChange }: ComposeDialogProps) {
  const [emailType, setEmailType] = useState<EmailType>(null);
  const router = useRouter();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setEmailType(null);
    onOpenChange(newOpen);
  };

  const handleTemplateSelect = (choice: "template" | "custom" | "none", templateId?: string) => {
    // Determine route based on selection
    if (choice === "template") {
      router.push(`/f/inbox/new?template=${templateId}&type=${emailType}`);
    } else if (choice === "custom") {
      router.push(`/f/inbox/new?custom=true&type=${emailType}`);
    } else {
      router.push(`/f/inbox/new?blank=true&type=${emailType}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        {emailType === null ? (
          <>
            <DialogHeader>
              <DialogTitle>Compose Email</DialogTitle>
              <DialogDescription>
                Choose whether you want to send a single email or a bulk email campaign.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <Button variant="outline" className="h-auto flex-col gap-3 p-6 bg-transparent" onClick={() => setEmailType("single")}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">Single Email</div>
                  <div className="text-sm text-muted-foreground">Send to one recipient</div>
                </div>
              </Button>

              <Button variant="outline" className="h-auto flex-col gap-3 p-6 bg-transparent" onClick={() => setEmailType("bulk")}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <div className="font-semibold">Bulk Email</div>
                  <div className="text-sm text-muted-foreground">Send to multiple recipients</div>
                </div>
              </Button>
            </div>
          </>
        ) : (
          <TemplateSelector emailType={emailType} onBack={() => setEmailType(null)} onSelect={handleTemplateSelect} />
        )}
      </DialogContent>
    </Dialog>
  );
}
