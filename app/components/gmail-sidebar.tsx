"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Archive, FileText, Inbox, Menu, PenSquare, Send, Star, Trash } from "lucide-react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useState } from "react"

export function GmailSidebar() {
  const pathname = usePathname()
  const params = useParams()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const currentFolder = params?.name as string

  const navItems = [
    { name: "inbox", label: "Inbox", icon: Inbox },
    { name: "starred", label: "Starred", icon: Star },
    { name: "drafts", label: "Drafts", icon: FileText },
    { name: "sent", label: "Sent", icon: Send },
    { name: "archive", label: "Archive", icon: Archive },
    { name: "trash", label: "Trash", icon: Trash },
  ]

  return (
    <div
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-full p-2 hover:bg-sidebar-accent transition-colors"
        >
          <Menu size={20} className="text-sidebar-foreground" />
        </button>
        {!isCollapsed && <span className="text-xl font-medium text-sidebar-foreground tracking-tight">Mail</span>}
        {!isCollapsed && <div className="w-8" />}
      </div>

      <div className="px-3 pb-6">
        <Link href={`/f/${currentFolder || "inbox"}/new`}>
          <Button
            className={cn(
              "w-full justify-start gap-3 rounded-full bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all",
              isCollapsed && "justify-center px-0",
            )}
            size="lg"
          >
            <PenSquare size={20} />
            {!isCollapsed && <span className="font-medium">Compose</span>}
          </Button>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentFolder === item.name

          return (
            <Link key={item.name} href={`/f/${item.name}`}>
              <div
                className={cn(
                  "flex items-center gap-4 rounded-full px-5 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  isCollapsed && "justify-center px-0",
                )}
              >
                <Icon size={20} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
