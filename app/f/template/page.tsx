"use client"

import { useState, use, useEffect } from "react" // --- ADDED useEffect ---
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, FileText, Sparkles, Briefcase, Heart } from "lucide-react"
import { getTemplatesAction } from "@/lib/db/actions" // --- ADDED ---

type EmailType = "single" | "bulk"

// --- This is your DATABASE template interface ---
interface DbTemplate {
  id: number;
  name: string;
  subject: string | null;
  body: string | null;
}

// --- REMOVED the hard-coded 'templates' array ---

export default function TemplatePage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const { name: folderName } = use(params)

  const [step, setStep] = useState<1 | 2>(1)
  const [emailType, setEmailType] = useState<EmailType | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  // --- ADDED state for loading your DB templates ---
  const [dbTemplates, setDbTemplates] = useState<DbTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // --- ADDED logic to fetch templates ---
  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true);
      const result = await getTemplatesAction();
      if (result.success && result.data) {
        setDbTemplates(result.data);
      }
      setIsLoading(false);
    }
    // Only load templates when we get to step 2
    if (step === 2) {
      loadTemplates();
    }
  }, [step]); // Re-run when 'step' changes

  const goToNewEmail = (templateId?: string) => {
    const query = templateId
      ? `?template=${templateId}&type=${emailType}`
      : "?type=" + emailType // for custom/no template
    router.push(`/f/${folderName}/new${query}`)
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      {step === 1 && (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Compose Email</h1>
          <p className="mb-6 text-muted-foreground">
            Choose whether you want to send a single email or a bulk email campaign.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex-col gap-2 p-6"
              onClick={() => { setEmailType("single"); setStep(2) }}
            >
              Single Email
            </Button>
            <Button
              variant="outline"
              className="flex-col gap-2 p-6"
              onClick={() => { setEmailType("bulk"); setStep(2) }}
            >
              Bulk Email
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={() => setStep(1)} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">Select a Template</h2>
          </div>

          <div className="grid gap-3 py-4 sm:grid-cols-2">
            {/* --- MODIFIED to use dbTemplates --- */}
            {isLoading ? (
              <p>Loading templates...</p>
            ) : (
              dbTemplates.map((t) => (
                <Card
                  key={t.id}
                  className={`cursor-pointer p-4 transition-all hover:border-primary ${
                    selectedTemplateId === t.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedTemplateId(t.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t.subject || "No Subject"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
            {/* --- END --- */}

            {/* Custom / No Template option */}
            <Card
              className="cursor-pointer p-4 transition-all border-dashed border-primary hover:border-primary"
              onClick={() => goToNewEmail()} // Call with no ID
            >
              <div className="flex items-center justify-center h-full">
                <span className="font-medium text-primary">Custom / No Template</span>
              </div>
            </Card>
          </div>

          <div className="flex justify-end mt-6 gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              disabled={!selectedTemplateId}
              onClick={() => goToNewEmail(String(selectedTemplateId))} // Pass ID as string
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}