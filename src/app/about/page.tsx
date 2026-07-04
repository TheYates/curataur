import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "About",
  description:
    "Curataur curates the best YouTube videos with synced transcripts, AI summaries, and full-text search — making expert knowledge searchable and accessible.",
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: {
    title: "About — Curataur",
    description:
      "Curataur curates the best YouTube videos with synced transcripts, AI summaries, and full-text search — making expert knowledge searchable and accessible.",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">About</h1>

      <section className="space-y-5 text-muted-foreground leading-relaxed">
        <p>
          Curataur is a curated library of YouTube videos — hand-picked, summarized,
          and made searchable down to every spoken word. Each video comes with a
          synced transcript so you can read along, jump to any moment, and search
          across the full library in an instant.
        </p>

        <p>
          YouTube is the world&rsquo;s largest educational resource, but finding
          the signal in the noise takes time. Great videos get buried, transcripts
          are hidden, and searching inside a video is essentially impossible.
          Curataur fixes that: one person finds the best content, AI extracts the
          key ideas, and the full transcript is indexed and clickable.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          Why this exists
        </h2>

        <p>
          I started Curataur because I spent hours watching YouTube tutorials,
          lectures, and deep dives — and kept wishing I could search them, skim
          them, and clip the important parts without scrubbing through a timeline.
          The transcript is the answer: once every word is searchable, a video
          becomes as usable as a blog post while keeping the depth of the original.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          What makes it different
        </h2>

        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-foreground">Human-curated.</strong> Every
            video is picked by a person who watches it first and writes a note
            about why it matters. No algorithms, no auto-publishing.
          </li>
          <li>
            <strong className="text-foreground">AI-enhanced, not AI-generated.</strong>{" "}
            Summaries and key takeaways are derived from the full transcript, but
            the transcript itself is untouched — every word is what the creator
            actually said.
          </li>
          <li>
            <strong className="text-foreground">Deep-searchable.</strong> Search
            isn&rsquo;t limited to titles — it searches the full text of every
            transcript, so you can find the exact moment someone said what
            you&rsquo;re looking for.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground pt-4">
          The curator
        </h2>

        <p>
          Curataur is a solo project. I find videos across topics I&rsquo;m
          genuinely interested in — finance, technology, science, engineering —
          and curate them here because I believe the best educational content
          deserves to be findable, readable, and searchable.
        </p>

        <p>
          If you have a video recommendation or just want to say hello, head to
          the{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact page
          </a>
          .
        </p>
      </section>
    </div>
  );
}
