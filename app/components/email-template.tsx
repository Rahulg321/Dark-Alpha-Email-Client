interface EmailTemplateProps {
  firstName: string
  lastName: string
  companyName: string
  companyWebsite?: string
  position?: string
  subject?: string
  body?: string
  signature?: string
}

export function EmailTemplate({
  firstName,
  lastName,
  companyName,
  companyWebsite,
  position,
  subject,
  body,
  signature,
}: EmailTemplateProps) {
  const fullName = `${firstName} ${lastName}`

  const replacePlaceholdersWithBold = (text: string) => {
    return text
      .replace(/\{firstName\}/g, `<strong class="font-bold">${firstName}</strong>`)
      .replace(/\{lastName\}/g, `<strong class="font-bold">${lastName}</strong>`)
      .replace(/\{companyName\}/g, `<strong class="font-bold">${companyName}</strong>`)
      .replace(/\{position\}/g, `<strong class="font-bold">${position || "representative"}</strong>`)
      .replace(/\n/g, "<br />")
  }

  const processedBody = body ? replacePlaceholdersWithBold(body) : ""
  const processedSubject = subject ? replacePlaceholdersWithBold(subject) : ""

  const signatureLines = signature ? signature.split("\n").filter((line) => line.trim()) : []

  return (
    <div className="space-y-4 font-sans text-sm leading-relaxed">
      {subject && (
        <div className="mb-4 border-b pb-2">
          <p className="text-xs text-muted-foreground">Subject:</p>
          <p className="font-semibold" dangerouslySetInnerHTML={{ __html: processedSubject }} />
        </div>
      )}

      <p className="text-base font-semibold">Dear {fullName},</p>

      <div dangerouslySetInnerHTML={{ __html: processedBody }} />

      <div className="mt-6 space-y-1">
        {signatureLines.map((line, index) => (
          <p key={index} className={index === 0 ? "font-semibold" : "text-muted-foreground"}>
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
