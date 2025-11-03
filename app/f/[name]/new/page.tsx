"use client";
import { useState, useEffect, useRef } from "react";
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
import { toast } from "sonner";
import { Copy, Send, Upload, Eye } from "lucide-react";
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
  const queryType = searchParams?.get("type") || "single";
  const isBulk = queryType === "bulk";
  const templateId = searchParams?.get("template") || null;

  // UI mode: DB or manual
  const [useDB, setUseDB] = useState(true);

  // Recipients
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState(0);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [manualBulkData, setManualBulkData] = useState<ManualRecipient[]>([]);
  const [manualData, setManualData] = useState<ManualRecipient>({
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    email: "",
  });

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [emailContent, setEmailContent] = useState<EmailContent>({
    subject: "Partnership Opportunity",
    body: `I hope this email finds you well. I'm reaching out to you as the {jobTitle} at {company}.\n\nWe've been following {company}'s work and are impressed by your innovative approach to the industry. I believe there could be valuable opportunities for collaboration between our organizations.\n\nWould you be available for a brief call next week to discuss potential partnership opportunities? I'd love to learn more about {company}'s current initiatives and share how we might be able to support your goals.\n\nLooking forward to connecting with you, {firstName}.`,
    signature: `Best Regards,\nYour Name\nYour Title\nYour Company`,
  });

  // Preview modal
  const [previewRecipient, setPreviewRecipient] = useState<Recipient | ManualRecipient | null>(null);

  // Pagination & search
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Load template
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

  // Handlers
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualData({ ...manualData, [e.target.name]: e.target.value });
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEmailContent({ ...emailContent, [e.target.name]: e.target.value });
  };

  const toggleRecipient = (id: number) =>
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const selectAllRecipients = () => setSelectedRecipients(recipients.map(r => r.id));
  const deselectAllRecipients = () => setSelectedRecipients([]);

  // Manual bulk handlers
  const addManualRecipient = () =>
    setManualBulkData((s) => [...s, { firstName: "", lastName: "", company: "", jobTitle: "", email: "" }]);
  const removeManualRecipient = (index: number) =>
    setManualBulkData((s) => s.filter((_, i) => i !== index));
  const updateManualRecipient = (index: number, field: keyof ManualRecipient, value: string) => {
    setManualBulkData((s) => {
      const copy = [...s];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Preview subject/body replacement
  const getPreviewBody = (data?: Partial<ManualRecipient> | Partial<Recipient>) => {
    if (!data) return emailContent.body;
    const firstName = data.firstName ?? "[First Name]";
    const lastName = data.lastName ?? "[Last Name]";
    const company = data.company ?? data.companyName ?? "[Company]";
    const jobTitle = data.jobTitle ?? data.position ?? "[Job Title]";
    const email = data.email ?? "[Email]";
    return emailContent.body
      .replace(/\{firstName\}/g, firstName)
      .replace(/\{lastName\}/g, lastName)
      .replace(/\{company\}/g, company)
      .replace(/\{companyName\}/g, company)
      .replace(/\{jobTitle\}/g, jobTitle)
      .replace(/\{email\}/g, email);
  };

  const getPreviewSubject = (data?: Partial<ManualRecipient> | Partial<Recipient>) => {
    if (!data) return emailContent.subject;
    const firstName = data.firstName ?? "[First Name]";
    const lastName = data.lastName ?? "[Last Name]";
    const company = data.company ?? data.companyName ?? "[Company]";
    const jobTitle = data.jobTitle ?? data.position ?? "[Job Title]";
    const email = data.email ?? "[Email]";
    return emailContent.subject
      .replace(/\{firstName\}/g, firstName)
      .replace(/\{lastName\}/g, lastName)
      .replace(/\{company\}/g, company)
      .replace(/\{companyName\}/g, company)
      .replace(/\{jobTitle\}/g, jobTitle)
      .replace(/\{email\}/g, email);
  };

  const currentData: ManualRecipient | Recipient =
    useDB && !isBulk
      ? recipients[selectedRecipientIndex] ?? manualData
      : manualData;

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
      const headers = rows[0].map((h: string) => h.toString().trim().toLowerCase());
      const dataRows = rows.slice(1);
      const mapped = dataRows.map((row) => {
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
        return {
          firstName: obj["firstname"] || obj["first name"] || obj["first_name"] || "",
          lastName: obj["lastname"] || obj["last name"] || obj["last_name"] || "",
          company: obj["company"] || obj["company name"] || obj["company_name"] || "",
          jobTitle: obj["jobtitle"] || obj["job title"] || obj["job_title"] || obj["title"] || "",
          email: obj["email"] || obj["email address"] || obj["email_address"] || "",
        };
      });
      setUseDB(false);
      setManualBulkData(mapped);
      toast.success("Excel loaded as manual recipients");
    } else {
      toast.error("Only CSV or XLSX files are supported");
    }
  };

  function parseCsv(csvText: string) {
    const rows = csvText.split(/\r?\n/).filter(Boolean);
    if (!rows.length) return;
    const headers = rows[0].split(",").map(h => h.trim().toLowerCase());
    const dataRows = rows.slice(1);
    const mapped = dataRows.map(r => {
      const cols = r.split(",").map(c => c.trim());
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
    setUseDB(false);
    setManualBulkData(mapped);
  }

  // Drag & drop
  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    await handleFile(e.dataTransfer.files?.[0] ?? null);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onChooseFileClick = () => fileInputRef.current?.click();
  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFile(e.target.files?.[0] ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Bulk list based on DB or manual
  const bulkList = useDB ? recipients.filter(r => selectedRecipients.includes(r.id)) : manualBulkData;

  // --- Improved search ---
  const filteredList = bulkList.filter(r =>
    r.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredList.length / rowsPerPage) || 1;

  // Clamp currentPage if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [rowsPerPage, filteredList, totalPages]);

  const paginatedList = filteredList.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Clipboard
  const copyToClipboard = async () => {
    if (!previewRecipient) return;
    const subject = getPreviewSubject(previewRecipient);
    const body = getPreviewBody(previewRecipient);
    const signature = emailContent.signature;
    await navigator.clipboard.writeText(`${subject}\n\n${body}\n\n${signature}`);
    toast.success("Email copied!");
  };
  const generateEmail = () => { toast.success("Your personalized email is ready"); };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Email Template Generator</h1>
          <p className="mt-2 text-muted-foreground">Create personalized email templates with dynamic content!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Template Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Template Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Subject</Label>
              <Input name="subject" value={emailContent.subject} onChange={handleEmailChange} />
              <Label>Body</Label>
              <textarea className="min-h-[200px] w-full rounded-md border px-3 py-2" name="body" value={emailContent.body} onChange={handleEmailChange} />
              <Label>Signature</Label>
              <textarea className="min-h-[100px] w-full rounded-md border px-3 py-2" name="signature" value={emailContent.signature} onChange={handleEmailChange} />
              <div className="flex gap-2 pt-2">
                <Button onClick={generateEmail} className="flex-1"><Send className="mr-2 h-4 w-4" />Generate Email</Button>
                <Button onClick={copyToClipboard} variant="outline"><Copy className="mr-2 h-4 w-4" />Copy</Button>
              </div>
            </CardContent>
          </Card>

          {/* Right: Recipients */}
          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
              <CardDescription>Manage and preview recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-2">
                <Button size="sm" variant={useDB ? "default" : "outline"} onClick={() => setUseDB(true)}>Database</Button>
                <Button size="sm" variant={!useDB ? "default" : "outline"} onClick={() => setUseDB(false)}>Upload</Button>
                {!useDB && <Button size="sm" onClick={onChooseFileClick}><Upload className="h-4 w-4 mr-1" />Upload File</Button>}
              </div>
              <div className="mb-2 flex items-center gap-2">
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                <Input type="number" placeholder="Rows/page" value={rowsPerPage} min={1} onChange={(e) => { setRowsPerPage(Number(e.target.value) || 50); setCurrentPage(1); }} className="w-24" />
              </div>

              {/* Recipient List */}
              <div className="space-y-1 max-h-[600px] overflow-y-auto border p-2 rounded"
                   onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
                {paginatedList.map((r, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-2 hover:bg-muted rounded px-2 py-1">
                    <span>{r.firstName} {r.lastName} ({r.company})</span>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => setPreviewRecipient(r)}><Eye className="h-4 w-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (useDB) setSelectedRecipients(prev => prev.filter(id => id !== (r as Recipient).id));
                        else setManualBulkData(prev => prev.filter((_, i) => i !== idx));
                        if (previewRecipient === r) setPreviewRecipient(null);
                      }}>X</Button>
                    </div>
                  </div>
                ))}
                {paginatedList.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No recipients found.</p>}
              </div>

              {/* Pagination */}
              <div className="mt-2 flex justify-between items-center">
                <Button size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                  Prev
                </Button>
                
                <span>Page {currentPage} of {totalPages || 1}</span>

                <div className="flex gap-1">
                  <Button size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                    Next
                  </Button>
                  <Button size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                    Last
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Preview Modal */}
        {previewRecipient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg p-6 max-w-lg w-full relative">
              <Button className="absolute top-2 right-2" onClick={() => setPreviewRecipient(null)}>X</Button>
              <h2 className="text-xl font-bold mb-2">{getPreviewSubject(previewRecipient)}</h2>
              <pre className="whitespace-pre-wrap">{getPreviewBody(previewRecipient)}</pre>
              <pre className="whitespace-pre-wrap mt-2">{emailContent.signature}</pre>
              <Button className="mt-4" onClick={copyToClipboard}>Copy Email</Button>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileInputChange} />
      </div>
    </div>
  );
}
