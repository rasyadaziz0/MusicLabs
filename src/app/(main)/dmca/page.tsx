import { Metadata } from 'next';
import { Shield, Mail, AlertTriangle, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DMCA Policy - AcadMusic',
  description: 'Digital Millennium Copyright Act (DMCA) policy and takedown request information for AcadMusic.',
};

export default function DMCAPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 pb-16">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FA243C]/10 text-[#FA243C]">
            <Shield size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-display)]">
            DMCA Policy
          </h1>
        </div>
        <p className="text-white/50 text-sm">
          Last updated: July 2026
        </p>
      </header>

      <section className="space-y-6">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            Important Notice
          </h2>
          <p className="text-white/70 leading-relaxed">
            AcadMusic (<strong>music.rasyadazizan.site</strong>) is a music discovery and streaming platform.
            We <strong>do not host, store, or distribute any audio files or copyrighted media</strong> on our servers.
          </p>
          <p className="text-white/70 leading-relaxed">
            Audio is streamed by resolving publicly available YouTube stream endpoints server-side.
            We <strong>do not permanently store, host, or redistribute raw audio files</strong> on our servers or CDN.
            We act solely as a search and discovery interface.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">How We Handle Content</h2>
          <ul className="space-y-3">
            {[
              'Audio playback is served by extracting streaming endpoints from YouTube — no media files are permanently hosted by us.',
              'Song metadata (titles, artist names, album art) is sourced from publicly available APIs (iTunes Search API, YouTube Music).',
              'Lyrics displayed on this platform are sourced from third-party public databases (LRCLIB, lyrics.ovh) and are shown for personal, non-commercial use only.',
              'No copyrighted material is permanently stored on our servers or CDN.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-white/70">
                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-[#FA243C] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Takedown Request</h2>
          <p className="text-white/70 leading-relaxed">
            If you are a copyright owner or an agent thereof, and you believe that any content accessible through
            AcadMusic infringes upon your copyright, you may submit a DMCA takedown notice by providing the following
            information to our designated agent:
          </p>
          <ol className="space-y-2 text-white/70 list-decimal list-inside">
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Identification of the material that is claimed to be infringing, including the URL.</li>
            <li>Your contact information (name, address, telephone number, and email).</li>
            <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner.</li>
            <li>A statement, under penalty of perjury, that the information in the notification is accurate and that you are authorized to act on behalf of the owner.</li>
            <li>Your physical or electronic signature.</li>
          </ol>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail size={18} className="text-[#FA243C]" />
            Contact for Takedown Requests
          </h2>
          <p className="text-white/70">
            Please send all DMCA takedown notices to:
          </p>
          <a
            href="mailto:dmca@music.rasyadazizan.site"
            className="inline-flex items-center gap-2 text-[#FA243C] hover:text-[#ff3a50] transition-colors font-medium"
          >
            dmca@music.rasyadazizan.site
            <ExternalLink size={14} />
          </a>
          <p className="text-white/50 text-sm">
            We will respond to valid takedown requests within 48 hours and remove or disable access
            to the allegedly infringing material promptly.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Counter-Notification</h2>
          <p className="text-white/70 leading-relaxed">
            If you believe that content was removed or disabled as a result of a mistake or misidentification,
            you may submit a counter-notification to the email address above. Your counter-notification must include
            the same types of information outlined above for takedown requests, along with a statement consenting
            to the jurisdiction of the relevant court.
          </p>
        </div>
      </section>
    </article>
  );
}
