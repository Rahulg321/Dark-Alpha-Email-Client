"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Send } from "lucide-react";
import { EmailTemplate } from "@/app/components/email-template";
// --- ADDED ---
import { getTemplateByIdAction } from "@/lib/db/actions";

type Recipient = {
  id: number;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle?: string;
  email: string;
};

type ManualRecipient = {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle?: string;
  email?: string;
};

type EmailContent = {
  subject: string;
  body: string;
  signature: string;
};

// --- REMOVED hard-coded TEMPLATE_LIBRARY ---

export default function NewEmailPage() {
  const searchParams = useSearchParams();
  const queryType = searchParams?.get("type") || "single"; // 'single' or 'bulk'
  const isBulk = queryType === "bulk";
  const templateId = searchParams?.get("template") || null;

  // UI mode: use DB or manual inputs (toggle on page)
  const [useDB, setUseDB] = useState<boolean>(true);

  // DB recipients and selection state
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState<number>(0); // for single DB
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]); // for bulk DB (IDs)

  // Manual single / bulk
  const [manualData, setManualData] = useState<ManualRecipient>({
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    email: "",
  });
  const [manualBulkData, setManualBulkData] = useState<ManualRecipient[]>(
    []
  );

  // Email content (subject/body/signature) — template will overwrite if ?template=...
  const [emailContent, setEmailContent] = useState<EmailContent>({
    subject: "Partnership Opportunity",
    body: `I hope this email finds you well. I'm reaching out to you as the {jobTitle} at {company}.\n\nWe've been following {company}'s work and are impressed by your innovative approach to the industry. I believe there could be valuable opportunities for collaboration between our organizations.\n\nWould you be available for a brief call next week to discuss potential partnership opportunities? I'd love to learn more about {company}'s current initiatives and share how we might be able to support your goals.\n\nLooking forward to connecting with you, {firstName}.`,
    signature: `Best Regards,\nYour Name\nYour Title\nYour Company`,
  });

  // Load recipients from /api/users (your existing API)
  useEffect(() => {
    async function fetchRecipients() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        // Normalize incoming data shape just in case
        const normalized: Recipient[] = (data || []).map((d: any, idx: number) => ({
          id: d.id ?? idx,
          firstName: d.firstName ?? d.first_name ?? d.first ?? "[First]",
          lastName: d.lastName ?? d.last_name ?? d.last ?? "[Last]",
          company: d.company ?? d.companyName ?? "",
          jobTitle: d.jobTitle ?? d.position ?? "",
          email: d.email ?? "",
        }));
        setRecipients(normalized);
        setSelectedRecipients(normalized.map((r) => r.id));
        setSelectedRecipientIndex(0);
      } catch (err) {
        console.error(err);
        toast.error("Error fetching recipients");
      }
    }
    fetchRecipients();
  }, []);

  // --- MODIFIED: This useEffect now loads from your database ---
  useEffect(() => {
    async function loadTemplate() {
      // Check if a template ID was passed in the URL
      if (templateId) {
        const result = await getTemplateByIdAction(Number(templateId));
        
        if (result.success && result.data) {
          // If found, update the email content state
          setEmailContent((prev) => ({
            ...prev, // Keep existing signature
            subject: result.data.subject || "",
            body: result.data.body || "",
          }));
          toast.success("Template loaded!");
        } else {
          // If not found (or error), show a toast
          toast.error(result.error);
        }
      }
    }
    loadTemplate();
  }, [templateId]); // This hook runs only when templateId in the URL changes

  // Handlers for manual input and email content
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualData({ ...manualData, [e.target.name]: e.target.value });
  };
  const handleEmailChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEmailContent({ ...emailContent, [e.target.name]: e.target.value });
  };

  // Bulk selection handlers
  const toggleRecipient = (id: number) =>
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const selectAllRecipients = () =>
    setSelectedRecipients(recipients.map((r) => r.id));
  const deselectAllRecipients = () => setSelectedRecipients([]);

  // Manual bulk handlers
  const addManualRecipient = () =>
    setManualBulkData((s) => [
      ...s,
      { firstName: "", lastName: "", company: "", jobTitle: "", email: "" },
    ]);
  const removeManualRecipient = (index: number) =>
    setManualBulkData((s) => s.filter((_, i) => i !== index));
  const updateManualRecipient = (
    index: number,
    field: keyof ManualRecipient,
    value: string
  ) => {
    setManualBulkData((s) => {
      const copy = [...s];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Helpers to render preview — accepts either DB recipient or manual recipient
  const getPreviewBody = (data?: Partial<ManualRecipient> | Partial<Recipient>) => {
    const firstName = data?.firstName ?? "[First Name]";
    const lastName = data?.lastName ?? "[Last Name]";
    const company = (data as any)?.company ?? (data as any)?.companyName ?? "[Company]";
    const jobTitle = (data as any)?.jobTitle ?? (data as any)?.position ?? "";

    return emailContent.body
      .replace(/\{firstName\}/g, firstName)
      .replace(/\{lastName\}/g, lastName)
      .replace(/\{company\}/g, company)
      .replace(/\{companyName\}/g, company)
      .replace(/\{jobTitle\}/g, jobTitle);
  };

  const getPreviewSubject = (data?: Partial<ManualRecipient> | Partial<Recipient>) => {
    const firstName = data?.firstName ?? "[First Name]";
    const company = (data as any)?.company ?? (data as any)?.companyName ?? "[Company]";
    return emailContent.subject
      .replace(/\{firstName\}/g, firstName)
      .replace(/\{company\}/g, company)
      .replace(/\{companyName\}/g, company);
  };

  // currentData for single mode (DB or manual)
  const currentData: ManualRecipient | Recipient =
    useDB && !isBulk
      ? recipients[selectedRecipientIndex] ?? {
          firstName: "[First Name]",
          lastName: "[Last Name]",
          company: "[Company]",
          jobTitle: "[Job Title]",
          email: "",
        }
      : manualData;

  // clipboard + generate placeholders
  const copyToClipboard = async () => {
    const emailText =
      document.getElementById("email-preview")?.innerText || "";
    await navigator.clipboard.writeText(emailText);
    toast.success("Email template copied to clipboard");
  };
  const generateEmail = () => {
    toast.success("Your personalized email is ready");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Email Template Generator</h1>
          <p className="mt-2 text-muted-foreground">
            Create personalized email templates with dynamic content!
          </p>
        </div>

        {/* Toggle: Use DB vs Manual (we keep this inside page) */}
        <div className="flex gap-4 mb-4">
          <Button variant={useDB ? "default" : "outline"} onClick={() => setUseDB(true)}>
            DB Recipients
          </Button>
          <Button variant={!useDB ? "default" : "outline"} onClick={() => setUseDB(false)}>
            Manual Input
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle>
                {useDB
                  ? isBulk
                    ? "Select Recipients"
                    : "Select Recipient"
                  : isBulk
                  ? "Manual Recipients"
                  : "Manual Recipient Input"}
              </CardTitle>
              <CardDescription>Customize the recipient details</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {useDB ? (
                isBulk ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border p-2 rounded">
                    <div className="flex justify-between mb-2">
                      <Button size="sm" onClick={selectAllRecipients}>
                        Select All
                      </Button>
                      <Button size="sm" onClick={deselectAllRecipients}>
                        Deselect All
                      </Button>
                    </div>
                    {recipients.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 py-1">
                        <input
                          aria-label={`select-${r.id}`}
                          type="checkbox"
                          checked={selectedRecipients.includes(r.id)}
                          onChange={() => toggleRecipient(r.id)}
                        />
                        <span className="truncate">
                          {r.firstName} {r.lastName} ({r.company})
                        </span>
                      </div>
                    ))}
                    {recipients.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recipients found.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Select Recipient</Label>
                    <select
                      value={selectedRecipientIndex}
                      onChange={(e) => setSelectedRecipientIndex(Number(e.target.value))}
                      className="w-full border rounded-md px-2 py-1"
                    >
                      {recipients.map((r, idx) => (
                        <option key={r.id} value={idx}>
                          {r.firstName} {r.lastName} ({r.company})
                        </option>
                      ))}
                    </select>
                  </div>
                )
              ) : isBulk ? (
                <div className="space-y-2">
                  {manualBulkData.map((m, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        placeholder="First Name"
                        value={m.firstName}
                        onChange={(e) => updateManualRecipient(idx, "firstName", e.target.value)}
                      />
                      <Input
                        placeholder="Last Name"
                        value={m.lastName}
                        onChange={(e) => updateManualRecipient(idx, "lastName", e.target.value)}
                      />
                      <Input
                        placeholder="Company"
                        value={m.company}
                        onChange={(e) => updateManualRecipient(idx, "company", e.target.value)}
                      />
                      <Button size="sm" onClick={() => removeManualRecipient(idx)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" onClick={addManualRecipient}>
                    Add Recipient
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input name="firstName" value={manualData.firstName} onChange={handleManualChange} />
                  <Label>Last Name</Label>
                  <Input name="lastName" value={manualData.lastName} onChange={handleManualChange} />
                  <Label>Company</Label>
                  <Input name="company" value={manualData.company} onChange={handleManualChange} />
                  <Label>Job Title</Label>
                  <Input name="jobTitle" value={manualData.jobTitle} onChange={handleManualChange} />
                  <Label>Email</Label>
                  <Input name="email" value={manualData.email} onChange={handleManualChange} />
                </div>
              )}

              {/* Email content inputs */}
              <div className="space-y-2 border-t pt-2">
                <Label>Subject</Label>
                <Input name="subject" value={emailContent.subject} onChange={handleEmailChange} />
                <Label>Body</Label>
                <textarea
                  name="body"
                  className="min-h-[200px] w-full rounded-md border px-3 py-2"
                  value={emailContent.body}
                  onChange={handleEmailChange}
                />
                <Label>Signature</Label>
                <textarea
                  name="signature"
                  className="min-h-[100px] w-full rounded-md border px-3 py-2"
                  value={emailContent.signature}
                  onChange={handleEmailChange}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={generateEmail} className="flex-1">
                  <Send className="mr-2 h-4 w-4" /> Generate Email
                </Button>
                <Button onClick={copyToClipboard} variant="outline">
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>See how your personalized email will look</CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <div
                    id="email-preview"
                    className="space-y-4 overflow-y-auto max-h-[600px] rounded-lg border bg-card p-6"
                  >
                    {useDB && isBulk && selectedRecipients.length > 0 ? (
                      // DB Bulk
                      recipients
                        .filter((r) => selectedRecipients.includes(r.id))
                        .map((r, idx, arr) => (
                          <div
                            key={r.id}
                            className={`pb-4 ${idx !== arr.length - 1 ? "border-b border-muted-foreground/20" : ""}`}
                          >
                            <EmailTemplate
                              firstName={r?.firstName}
                              lastName={r?.lastName}
                              companyName={r?.company}
                              position={r?.jobTitle}
                              subject={getPreviewSubject(r)}
                              body={getPreviewBody(r)}
                              signature={emailContent.signature}
                            />
                          </div>
                        ))
                    ) : !useDB && isBulk && manualBulkData.length > 0 ? (
                      // Manual Bulk
                      manualBulkData.map((m, idx, arr) => (
                        <div
                          key={idx}
                          className={`pb-4 ${idx !== arr.length - 1 ? "border-b border-muted-foreground/20" : ""}`}
                        >
                          <EmailTemplate
                            firstName={m.firstName}
                            lastName={m.lastName}
                            companyName={m.company}
                            position={m.jobTitle}
                            subject={getPreviewSubject(m)}
                            body={getPreviewBody(m)}
                            signature={emailContent.signature}
                          />
                        </div>
                      ))
                    ) : (
                      // Single (DB or Manual)
                      <EmailTemplate
                        firstName={(currentData as any)?.firstName}
                        lastName={(currentData as any)?.lastName}
                        companyName={(currentData as any)?.company}
                        position={(currentData as any)?.jobTitle}
                        subject={getPreviewSubject(currentData)}
                        body={getPreviewBody(currentData)}
                        signature={emailContent.signature}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="html" className="mt-4">
                  <pre className="overflow-x-auto text-xs bg-muted p-4 rounded">
                    {/* very basic HTML preview list */}
                    {useDB && isBulk
                      ? recipients
                          .filter((r) => selectedRecipients.includes(r.id))
                          .map(
                            (r) =>
                              `<EmailTemplate
  firstName="${r.firstName}"
  lastName="${r.lastName}"
  companyName="${r.company}"
  position="${r.jobTitle}"
  subject="${getPreviewSubject(r)}"
  body="${getPreviewBody(r)}"
  signature="${emailContent.signature}"
/>`
                          )
                          .join("\n\n")
                      : !useDB && isBulk
                      ? manualBulkData
                          .map(
                            (m) =>
                              `<EmailTemplate
  firstName="${m.firstName}"
  lastName="${m.lastName}"
  companyName="${m.company}"
  position="${m.jobTitle}"
  subject="${getPreviewSubject(m)}"
  body="${getPreviewBody(m)}"
  signature="${emailContent.signature}"
/>`
                          )
                          .join("\n\n")
                      : `<EmailTemplate
  firstName="${(currentData as any)?.firstName}"
  lastName="${(currentData as any)?.lastName}"
  companyName="${(currentData as any)?.company}"
  position="${(currentData as any)?.jobTitle}"
  subject="${getPreviewSubject(currentData)}"
  body="${getPreviewBody(currentData)}"
  signature="${emailContent.signature}"
/>`}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}