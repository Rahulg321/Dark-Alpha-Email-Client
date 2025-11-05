"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

export function BackHeader() {
  const pathname = usePathname();
  const isInbox = pathname === "/" || pathname === "/f/inbox";

  if (isInbox) return null;

  return (
    <header className="p-4 border-b flex items-center gap-2">
      <Link href="#" onClick={() => history.back()}>
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <span className="font-medium">Back to Inbox</span>
    </header>
  );
}
