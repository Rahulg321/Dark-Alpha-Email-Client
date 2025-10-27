'use client'

import { Toaster } from 'sonner'

export function ToasterClient() {
  return <Toaster closeButton={true} /> // ✅ default close button
}
