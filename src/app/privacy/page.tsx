import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Curataur privacy policy — what data is collected and how it is used.",
  alternates: { canonical: `${siteUrl}/privacy` },
  openGraph: {
    title: "Privacy Policy — Curataur",
    description: "Curataur privacy policy — what data is collected and how it is used.",
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-5 text-muted-foreground leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            What data we collect
          </h2>
          <p>
            We collect only the data you voluntarily provide. If you subscribe to
            the newsletter (coming soon), we collect your email address. We do not
            collect names, IP addresses beyond what is necessary for server
            operations, or any browsing history beyond standard server logs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            How we use your data
          </h2>
          <p>
            Email addresses are used exclusively for sending the newsletter you
            signed up for. We never share, sell, or rent your email to third
            parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Cookies
          </h2>
          <p>
            This site may use cookies for analytics and, in the future, for
            serving advertisements via Google AdSense. Google AdSense uses cookies
            to serve personalized ads based on your browsing history. You can opt
            out of personalized advertising by visiting{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google&rsquo;s Ad Settings
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            YouTube embeds
          </h2>
          <p>
            This site embeds YouTube videos using YouTube&rsquo;s official embed
            player. YouTube may set cookies on your device when you view a page
            with an embedded video, as described in{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google&rsquo;s Privacy Policy
            </a>
            . We do not control these cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Third-party services
          </h2>
          <p>
            We use the following third-party services:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              <strong>Supabase</strong> — database hosting. Your email (if
              subscribed) is stored in Supabase.
            </li>
            <li>
              <strong>Vercel</strong> — hosting and server-side rendering.
              Standard server logs may include IP addresses and request metadata.
            </li>
            <li>
              <strong>YouTube (Google)</strong> — embedded video player. See
              YouTube&rsquo;s privacy policy for how they handle data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Your rights
          </h2>
          <p>
            You can request deletion of your data at any time by emailing{" "}
            <a
              href="mailto:curataur@henryates.com"
              className="text-primary hover:underline"
            >
              curataur@henryates.com
            </a>
            . We will delete your email and any associated data within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Changes to this policy
          </h2>
          <p>
            If we make changes to this policy, we will update the &ldquo;Last
            updated&rdquo; date at the top of this page. Continued use of the
            site after changes constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>
    </div>
  );
}
