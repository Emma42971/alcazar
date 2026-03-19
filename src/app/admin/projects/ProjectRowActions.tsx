"use client"
import Link from "next/link"
export function ProjectRowActions({ projectId, slug, isFeatured }: { projectId: string; slug: string; isFeatured: boolean }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Link href={`/admin/projects/${projectId}`} className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>Edit</Link>
      <Link href={`/projects/${slug}?preview=1`} target="_blank" className="text-xs px-2.5 py-1 rounded-lg border" style={{ borderColor: "hsl(0 0% 16%)", color: "hsl(0 0% 55%)" }}>Preview</Link>
    </div>
  )
}
