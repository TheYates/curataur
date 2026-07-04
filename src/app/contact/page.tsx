import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Curataur — send a video recommendation, ask a question, or just say hello.",
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: {
    title: "Contact — Curataur",
    description:
      "Get in touch with Curataur — send a video recommendation, ask a question, or just say hello.",
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Contact</h1>

      <div className="space-y-5 text-muted-foreground leading-relaxed">
        <p>
          Have a video recommendation, a question about the site, or just want to
          say hello? Reach out — I read every message.
        </p>

        <div className="rounded-lg border bg-card p-6 mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Email
          </h2>
          <p className="text-sm">
            <a
              href="mailto:curataur@henryates.com"
              className="text-primary hover:underline"
            >
              curataur@henryates.com
            </a>
          </p>
        </div>

        <p className="text-sm text-muted-foreground/70 pt-4">
          I typically reply within a few days. If you&rsquo;re suggesting a video,
          including the YouTube link and a sentence about why it fits the site
          helps a lot.
        </p>
      </div>
    </div>
  );
}
