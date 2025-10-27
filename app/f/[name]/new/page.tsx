"use client";
import { useState, useEffect, useRef} from "react";
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
import { Copy, Send, Upload } from "lucide-react";
import { EmailTemplate } from "@/app/components/email-template";
import { getTemplateByIdAction } from "@/lib/db/actions";
import * as XLSX from "xlsx";

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
  const [manualBulkData, setManualBulkData] = useState<ManualRecipient[]>([]);
  
  // drag/drop state
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- ADDED: State for active preview tab in bulk mode ---
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);

  /** --- Fetch DB recipients --- */
  useEffect(() => {
    async function fetchRecipients() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
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

  // Email content (subject/body/signature) — template will overwrite if ?template=...
  const [emailContent, setEmailContent] = useState<EmailContent>({
    subject: "Partnership Opportunity",
    body: `I hope this email finds you well. I'm reaching out to you as the {jobTitle} at {company}.\n\nWe've been following {company}'s work and are impressed by your innovative approach to the industry. I believe there could be valuable opportunities for collaboration between our organizations.\n\nWould you be available for a brief call next week to discuss potential partnership opportunities? I'd love to learn more about {company}'s current initiatives and share how we might be able to support your goals.\n\nLooking forward to connecting with you, {firstName}.`,
    signature: `Best Regards,\nYour Name\nYour Title\nYour Company`,
  });

  // --- MODIFIED: Load template from database ---
  useEffect(() => {
    async function loadTemplate() {
      if (templateId) {
        const result = await getTemplateByIdAction(Number(templateId));
        
        if (result.success && result.data) {
          setEmailContent((prev) => ({
            ...prev,
            subject: result.data.subject || "",
            body: result.data.body || "",
          }));
          toast.success("Template loaded!");
        } else {
          toast.error(result.error);
        }
      }
    }
    loadTemplate();
  }, [templateId]);

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

  // Helpers to render preview
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

  // --- ADDED: Determine the list of recipients for bulk preview ---
  const bulkPreviewList = useDB
    ? recipients.filter((r) => selectedRecipients.includes(r.id))
    : manualBulkData;

  // --- ADDED: Reset active index if list changes ---
  useEffect(() => {
    setActivePreviewIndex(0); // Reset to first tab when list changes
  }, [bulkPreviewList.length, useDB]); // Dependencies: list length and source

  // clipboard + generate placeholders
  const copyToClipboard = async () => {
    // --- MODIFIED: Copy content of the active preview ---
    const activeRecipient = isBulk ? bulkPreviewList[activePreviewIndex] : currentData;
    if (!activeRecipient) return;

    const subject = getPreviewSubject(activeRecipient);
    const body = getPreviewBody(activeRecipient);
    const signature = emailContent.signature;
    const emailText = `${subject}\n\n${body}\n\n${signature}`;

    await navigator.clipboard.writeText(emailText);
    toast.success("Email template copied to clipboard");
  };
  const generateEmail = () => {
    toast.success("Your personalized email is ready");
  };

  /** --- File parsing --- */
  const handleFile = async (file: File | null) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv")) {
      const text = await file.text();
      parseCsv(text);
      toast.success("CSV loaded");
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const headers = rows[0].map((h: string) => h.toString().trim().toLowerCase()); // Lowercase headers
      const dataRows = rows.slice(1);

      const mapped = dataRows.map((row) => {
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] ?? ""; // Map header to column index
        });
        // More robust header matching
        return {
          firstName: obj["firstname"] || obj["first name"] || obj["first_name"] || "",
          lastName: obj["lastname"] || obj["last name"] || obj["last_name"] || "",
          company: obj["company"] || obj["company name"] || obj["company_name"] || "",
          jobTitle: obj["jobtitle"] || obj["job title"] || obj["job_title"] || obj["title"] || "",
          email: obj["email"] || obj["email address"] || obj["email_address"] || "",
        };
      });

      setUseDB(false); // Switch to manual mode for file uploads
      setManualBulkData(mapped);
      toast.success("Excel loaded as manual recipients");
    } else {
      toast.error("Only CSV or XLSX files are supported");
    }
  };
  function parseCsv(csvText: string) {
    const rows = csvText.split(/\r?\n/).filter(Boolean);
    if (!rows.length) return;
    const headers = rows[0].split(",").map((h) => h.trim().toLowerCase()); // Lowercase headers
    const dataRows = rows.slice(1);
    const mapped = dataRows.map((r) => {
      const cols = r.split(",").map((c) => c.trim());
      const obj: any = {};
      headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
      return {
        firstName: obj["firstname"] || obj["first name"] || obj["first_name"] || "",
        lastName: obj["lastname"] || obj["last name"] || obj["last_name"] || "",
        company: obj["company"] || obj["company name"] || obj["company_name"] || "",
        jobTitle: obj["jobtitle"] || obj["job title"] || obj["job_title"] || obj["title"] || "",
        email: obj["email"] || obj["email address"] || obj["email_address"] || "",
      };
    });
    setUseDB(false); // Switch to manual mode for file uploads
    setManualBulkData(mapped);
  }
  /** --- Drag & drop handlers --- */
  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    await handleFile(e.dataTransfer.files?.[0] ?? null);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onChooseFileClick = () => fileInputRef.current?.click();
  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFile(e.target.files?.[0] ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  /** --- Render --- */
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Email Template Generator</h1>
          <p className="mt-2 text-muted-foreground">
            Create personalized email templates with dynamic content!
          </p>
        </div>

        {/* Toggle */}
        <div className="flex gap-4 mb-4">
          <Button variant={useDB ? "default" : "outline"} onClick={() => setUseDB(true)}>DB Recipients</Button>
          <Button variant={!useDB ? "default" : "outline"} onClick={() => setUseDB(false)}>Manual Input</Button>
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
                  ? "Manual Recipients / Upload" // Modified Title
                  : "Manual Recipient Input"}
              </CardTitle>
              <CardDescription>Customize the recipient details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Recipients Selection/Input */}
              {useDB ? (
                isBulk ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border p-2 rounded">
                    <div className="flex justify-between mb-2">
                      <Button size="sm" onClick={selectAllRecipients}>Select All</Button>
                      <Button size="sm" onClick={deselectAllRecipients}>Deselect All</Button>
                    </div>
                    {recipients.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 py-1">
                        <input aria-label={`select-${r.id}`} type="checkbox" checked={selectedRecipients.includes(r.id)} onChange={() => toggleRecipient(r.id)} />
                        <span className="truncate">{r.firstName} {r.lastName} ({r.company})</span>
                      </div>
                    ))}
                     {recipients.length === 0 && (
                      <p className="text-sm text-muted-foreground">No recipients found.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Select Recipient</Label>
                    <select value={selectedRecipientIndex} onChange={(e) => setSelectedRecipientIndex(Number(e.target.value))} className="w-full border rounded-md px-2 py-1">
                      {recipients.map((r, idx) => <option key={r.id} value={idx}>{r.firstName} {r.lastName} ({r.company})</option>)}
                    </select>
                  </div>
                )
              ) : isBulk ? (
                <>
                  {/* File upload for Manual Bulk */}
                  <div>
                    <Label>Upload Recipients (CSV or XLSX)</Label>
                    <div
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onClick={onChooseFileClick}
                      className={`mt-2 rounded border-2 border-dashed p-6 text-center cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-muted"}`}
                    >
                      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileInputChange} />
                      <div className="flex items-center justify-center gap-2">
                        <Upload />
                        <span>{dragOver ? "Drop file to upload" : "Drag & drop CSV/XLSX here, or click to choose"}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      File should include a header row (e.g. firstName,lastName,company,jobTitle,email)
                    </p>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto border p-2 rounded mt-2">
                    {manualBulkData.map((m, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input placeholder="First Name" value={m.firstName} onChange={(e) => updateManualRecipient(idx, "firstName", e.target.value)} />
                        <Input placeholder="Last Name" value={m.lastName} onChange={(e) => updateManualRecipient(idx, "lastName", e.target.value)} />
                        <Input placeholder="Company" value={m.company} onChange={(e) => updateManualRecipient(idx, "company", e.target.value)} />
                        <Input placeholder="Job Title" value={m.jobTitle} onChange={(e) => updateManualRecipient(idx, "jobTitle", e.target.value)} />
                        <Input placeholder="Email" value={m.email} onChange={(e) => updateManualRecipient(idx, "email", e.target.value)} />
                        <Button size="sm" variant="destructive" onClick={() => removeManualRecipient(idx)}>X</Button>
                      </div>
                    ))}
                    {manualBulkData.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">No manual recipients added yet.</p>
                    )}
                  </div>
                  <Button size="sm" onClick={addManualRecipient}>Add Manual Recipient</Button>
                </>
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


              {/* Email inputs */}
              <div className="space-y-2 border-t pt-4">
                <Label>Subject</Label>
                <Input name="subject" value={emailContent.subject} onChange={handleEmailChange} />
                <Label>Body</Label>
                <textarea name="body" className="min-h-[200px] w-full rounded-md border px-3 py-2" value={emailContent.body} onChange={handleEmailChange} />
                <Label>Signature</Label>
                <textarea name="signature" className="min-h-[100px] w-full rounded-md border px-3 py-2" value={emailContent.signature} onChange={handleEmailChange} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={generateEmail} className="flex-1"><Send className="mr-2 h-4 w-4" /> Generate Email</Button>
                <Button onClick={copyToClipboard} variant="outline"><Copy className="mr-2 h-4 w-4" /> Copy</Button>
              </div>
            </CardContent>
          </Card>

          {/* --- Preview Panel REFACTORED --- */}
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>See how your personalized email will look</CardDescription>
            </CardHeader>

            <CardContent>
              {isBulk && bulkPreviewList.length > 0 ? (
                // --- Bulk Mode: Use Tabs ---
                <Tabs
                  value={String(activePreviewIndex)} // Control active tab with state
                  onValueChange={(value) => setActivePreviewIndex(Number(value))} // Update state on change
                  className="w-full"
                >
                  {/* --- Scrollable Tab List --- */}
                  <div className="overflow-x-auto pb-2">
                     <TabsList className="inline-flex h-auto">
                      {bulkPreviewList.map((r, idx) => (
                        <TabsTrigger key={idx} value={String(idx)} className="text-xs px-2 py-1 h-auto">
                          {r.firstName || `Recipient ${idx + 1}`}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* --- Tab Content: Render only the active preview --- */}
                  {bulkPreviewList.length > activePreviewIndex && (
                     <TabsContent value={String(activePreviewIndex)} className="mt-4">
                       <div id={`email-preview-${activePreviewIndex}`} className="rounded-lg border bg-card p-6 max-h-[600px] overflow-y-auto">
                         <EmailTemplate
                           firstName={bulkPreviewList[activePreviewIndex]?.firstName}
                           lastName={bulkPreviewList[activePreviewIndex]?.lastName}
                           companyName={bulkPreviewList[activePreviewIndex]?.company}
                           position={bulkPreviewList[activePreviewIndex]?.jobTitle}
                           subject={getPreviewSubject(bulkPreviewList[activePreviewIndex])}
                           body={getPreviewBody(bulkPreviewList[activePreviewIndex])}
                           signature={emailContent.signature}
                         />
                       </div>
                     </TabsContent>
                  )}
                </Tabs>
                // --- End Bulk Mode ---
              ) : !isBulk ? (
                 // --- Single Mode: Original Preview ---
                 <Tabs defaultValue="preview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                  </TabsList>
                   <TabsContent value="preview" className="mt-4">
                    <div id="email-preview" className="rounded-lg border bg-card p-6 max-h-[600px] overflow-y-auto">
                      <EmailTemplate
                        firstName={(currentData as any)?.firstName}
                        lastName={(currentData as any)?.lastName}
                        companyName={(currentData as any)?.company}
                        position={(currentData as any)?.jobTitle}
                        subject={getPreviewSubject(currentData)}
                        body={getPreviewBody(currentData)}
                        signature={emailContent.signature}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="html" className="mt-4">
                     <pre className="overflow-x-auto text-xs bg-muted p-4 rounded max-h-[600px]">
                      {`<EmailTemplate
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
                 // --- End Single Mode ---
              ) : (
                // --- Placeholder when bulk list is empty ---
                <div className="text-center text-muted-foreground mt-4">
                  Select recipients or upload a file to see previews.
                </div>
              )}
            </CardContent>
          </Card>
           {/* --- End Preview Panel Refactor --- */}
        </div>
      </div>
    </div>
  );
}