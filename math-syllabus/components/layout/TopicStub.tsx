import Link from "next/link";

interface TopicStubProps {
  subject: string;
  subjectPath: string;
  topic: string;
  /** Brief teaser of what the lesson will cover */
  preview?: string;
}

/**
 * Placeholder page for topics not yet built.
 * Each stub shows the topic title, a "coming soon" message,
 * and a breadcrumb back to the subject area.
 */
export default function TopicStub({ subject, subjectPath, topic, preview }: TopicStubProps) {
  return (
    <div className="prose">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-foreground-subtle">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <span className="mx-2">›</span>
        <Link href={subjectPath} className="hover:text-accent transition-colors">{subject}</Link>
        <span className="mx-2">›</span>
        <span className="text-foreground-muted">{topic}</span>
      </nav>

      <h1>{topic}</h1>

      <div className="rounded-xl border-2 border-dashed border-border bg-surface p-8 text-center">
        <div className="text-4xl mb-3">🚧</div>
        <h2 className="text-lg font-semibold text-foreground m-0 mb-2">Coming Soon</h2>
        <p className="text-foreground-muted m-0">
          {preview ?? "This interactive lesson is under construction. Check back soon!"}
        </p>
      </div>
    </div>
  );
}
