import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Disclosure",
  description:
    "Curataur affiliate and advertising disclosure — transparency about how the site is supported.",
  alternates: { canonical: `${siteUrl}/disclosure` },
  openGraph: {
    title: "Disclosure — Curataur",
    description:
      "Curataur affiliate and advertising disclosure — transparency about how the site is supported.",
  },
};

export default function DisclosurePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Disclosure</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-5 text-muted-foreground leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Affiliate links
          </h2>
          <p>
            Some links on Curataur may be affiliate links. If you click an
            affiliate link and make a purchase, we may earn a small commission at
            no extra cost to you. We only recommend products, tools, and resources
            we genuinely believe are useful — affiliate relationships never
            influence what we curate or recommend.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Advertising
          </h2>
          <p>
            Curataur may display advertisements via Google AdSense or other ad
            networks. These ads are served by third parties and are not directly
            controlled by us. We do not endorse advertised products unless
            explicitly stated.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Sponsored content
          </h2>
          <p>
            We do not accept sponsored videos or paid placements. All videos on
            Curataur are selected by the curator based on educational value, not
            payment. If this changes in the future, sponsored content will be
            clearly labeled as such.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Questions
          </h2>
          <p>
            If you have any questions about this disclosure, reach out via the{" "}
            <a
              href="/contact"
              className="text-primary hover:underline"
            >
              contact page
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
