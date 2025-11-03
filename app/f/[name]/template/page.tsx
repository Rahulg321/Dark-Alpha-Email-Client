"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, FileText, PlusCircle } from "lucide-react"
import { getTemplatesAction } from "@/lib/db/actions"
import { toast } from "sonner"
import { TemplateEditorModal } from "@/app/components/template-editor-modal"

type EmailType = "single" | "bulk"

interface DbTemplate {
  id: number
  name: string
  subject: string | null
  body: string | null
}

export default function TemplatePage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const [folderName, setFolderName] = useState<string>("")

  useEffect(() => {
    async function unwrapParams() {
      const resolved = await params
      setFolderName(resolved.name)
    }
    unwrapParams()
  }, [params])

  const [step, setStep] = useState<1 | 2>(1)
  const [emailType, setEmailType] = useState<EmailType | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [dbTemplates, setDbTemplates] = useState<DbTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true)
      try {
        const result = await getTemplatesAction()
        if (result?.success && result.data) {
          setDbTemplates(result.data)
        } else {
          toast.error(result?.error || "Failed to load templates")
        }
      } catch (err) {
        console.error(err)
        toast.error("Failed to load templates")
      } finally {
        setIsLoading(false)
      }
    }

    if (step === 2) loadTemplates()
  }, [step])

  const goToNewEmail = (templateId?: string) => {
    const query = templateId ? `?template=${templateId}&type=${emailType}` : "?type=" + emailType
    router.push(`/f/${folderName}/new${query}`)
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      {/* STEP 1: choose email type */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Compose Email</h1>
          <p className="mb-6 text-muted-foreground">
            Choose whether you want to send a single email or a bulk email campaign.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="flex-col gap-2 p-6 bg-transparent"
              onClick={() => {
                setEmailType("single")
                setStep(2)
              }}
            >
              Single Email
            </Button>
            <Button
              variant="outline"
              className="flex-col gap-2 p-6 bg-transparent"
              onClick={() => {
                setEmailType("bulk")
                setStep(2)
              }}
            >
              Bulk Email
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: select or create template */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={() => setStep(1)} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">Select a Template</h2>
            <div className="ml-auto">
              <Button onClick={() => setShowCreate(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </div>

          <div className="grid gap-3 py-4 sm:grid-cols-2">
            {isLoading ? (
              <p>Loading templates...</p>
            ) : dbTemplates.length === 0 ? (
              <p>No templates available yet.</p>
            ) : (
              dbTemplates.map((t) => (
                <Card
                  key={t.id}
                  className={`cursor-pointer p-6 transition-all hover:border-primary ${selectedTemplateId === t.id ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setSelectedTemplateId(t.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{t.name}</h3>
                      <p className="text-sm text-muted-foreground">{t.subject || "No Subject"}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}

            <Card
              className="cursor-pointer p-6 transition-all border-dashed border-primary hover:border-primary"
              onClick={() => goToNewEmail()}
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
            <Button disabled={!selectedTemplateId} onClick={() => goToNewEmail(String(selectedTemplateId))}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Modal for creating new templates */}
      <TemplateEditorModal
        isOpen={showCreate}
        onOpenChange={setShowCreate}
        onActionComplete={async (newTemplateId?: number) => {
          setShowCreate(false)
          setSelectedTemplateId(newTemplateId ?? null)
          const res = await getTemplatesAction()
          if (res.success && res.data) setDbTemplates(res.data)
        }}
      />
    </div>
  )
}
