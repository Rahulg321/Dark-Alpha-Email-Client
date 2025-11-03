import { GmailSidebar } from "@/app/components/gmail-sidebar"
import { ThreadActions } from "@/app/components/thread-actions"
import { Button } from "@/components/ui/button"
import { getEmailsForThread } from "@/lib/db/queries"
import { ArrowLeft, Reply, ReplyAll, Forward } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function EmailPage({
  params,
}: {
  params: Promise<{ name: string; id: string }>
}) {
  const { name, id } = await params
  const thread = await getEmailsForThread(id)

  if (!thread || thread.emails.length === 0) {
    notFound()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <GmailSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center gap-3 border-b border-border px-6">
          <Link href={`/f/${name}`}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex-1" />
          <ThreadActions threadId={thread.id} />
        </div>

        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">
            <h1 className="mb-8 text-2xl font-normal text-foreground tracking-tight">{thread.subject}</h1>

            <div className="space-y-6">
              {thread.emails.map((email, index) => (
                <div key={email.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  {/* Email header */}
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                        {email.sender.firstName[0]}
                        {email.sender.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {email.sender.firstName} {email.sender.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{email.sender.email}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {new Date(email.sentDate!).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Email body */}
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">{email.body}</div>

                  {index === thread.emails.length - 1 && (
                    <div className="mt-6 flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2 rounded-full bg-transparent">
                        <Reply size={16} />
                        Reply
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 rounded-full bg-transparent">
                        <ReplyAll size={16} />
                        Reply all
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 rounded-full bg-transparent">
                        <Forward size={16} />
                        Forward
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
