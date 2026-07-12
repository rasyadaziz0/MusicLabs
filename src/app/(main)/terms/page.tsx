import { Metadata } from 'next';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - AcadMusic',
  description: 'Terms of Service for AcadMusic - a music discovery and streaming platform.',
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 pb-16">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2F2FE4]/10 text-[#2F2FE4]">
            <FileText size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-display)]">
            Terms of Service
          </h1>
        </div>
        <p className="text-white/50 text-sm">Last updated: July 2026</p>
      </header>

      <section className="space-y-6 text-white/70 leading-relaxed">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using AcadMusic (&quot;music.rasyadazizan.site&quot;, the &quot;Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. Description of Service</h2>
          <p>
            AcadMusic is a free music discovery and streaming platform. The Service provides search, playback
            (via third-party embeds), playlist management, lyrics display, and music recommendations.
            We do not host or store any audio files on our servers.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. User Accounts</h2>
          <p>
            You may create an account using Google OAuth. You are responsible for maintaining the security
            of your account. You agree not to share your login credentials or use another person&apos;s account.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Use the Service for any unlawful purpose.</li>
            <li>Attempt to circumvent any security measures or access restrictions.</li>
            <li>Scrape, crawl, or use automated tools to extract data from the Service beyond normal usage.</li>
            <li>Upload malicious content or attempt to exploit vulnerabilities.</li>
            <li>Impersonate other users or entities.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Intellectual Property</h2>
          <p>
            All music metadata, lyrics, and media are provided by third-party APIs (iTunes, YouTube Music, LRCLIB).
            We do not claim ownership of this content. All trademarks, logos, and brand names belong to their
            respective owners.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Third-Party Services</h2>
          <p>
            The Service integrates with third-party platforms including YouTube, iTunes/Apple Music, and Google.
            Your use of these integrations is subject to their respective terms of service.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted
            access, data accuracy, or that the Service will meet your specific requirements.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, AcadMusic shall not be liable for any indirect, incidental,
            or consequential damages arising from your use of the Service.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be posted on this page
            with an updated &quot;Last updated&quot; date. Continued use of the Service constitutes acceptance
            of the revised Terms.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:dmca@music.rasyadazizan.site" className="text-[#FA243C] hover:text-[#ff3a50] transition-colors">
              dmca@music.rasyadazizan.site
            </a>.
          </p>
        </div>
      </section>
    </article>
  );
}
