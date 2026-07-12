import { Metadata } from 'next';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - AcadMusic',
  description: 'Privacy Policy for AcadMusic - how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 pb-16">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Lock size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-display)]">
            Privacy Policy
          </h1>
        </div>
        <p className="text-white/50 text-sm">Last updated: July 2026</p>
      </header>

      <section className="space-y-6 text-white/70 leading-relaxed">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
          <p>When you use AcadMusic, we may collect the following information:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Account Information:</strong> When you sign in with Google, we receive your name, email address, and profile picture from Google OAuth.</li>
            <li><strong>Usage Data:</strong> Listening history, liked tracks, playlists, and music preferences to provide personalized recommendations.</li>
            <li><strong>Device Information:</strong> Browser type, operating system, and screen size for responsive design purposes.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>To provide and maintain the Service (playlists, history, recommendations).</li>
            <li>To personalize your experience (AI-powered Discover Weekly, music recap).</li>
            <li>To display your public profile and now-playing status (if enabled).</li>
            <li>To improve the Service and fix bugs.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">3. Data Storage</h2>
          <p>
            Your data is stored securely on <strong>Supabase</strong> (PostgreSQL database hosted on AWS).
            Profile images and playlist covers are stored on <strong>Cloudflare R2</strong> with a custom domain.
            We do not store any audio files.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">4. Third-Party Services</h2>
          <p>We integrate with the following third-party services that may collect data under their own privacy policies:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Google OAuth:</strong> For authentication.</li>
            <li><strong>YouTube:</strong> For music playback (subject to YouTube&apos;s Terms of Service and Google Privacy Policy).</li>
            <li><strong>iTunes/Apple Music API:</strong> For song metadata and search.</li>
            <li><strong>Vercel Analytics:</strong> For anonymous usage analytics.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">5. Cookies</h2>
          <p>
            We use essential cookies for authentication sessions (Supabase Auth). We do not use advertising
            or tracking cookies.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">6. Data Sharing</h2>
          <p>
            We do not sell, trade, or share your personal data with third parties for marketing purposes.
            Data is only shared as necessary to operate the Service (e.g., Supabase for database, Cloudflare for CDN).
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Access your personal data stored in the Service.</li>
            <li>Request deletion of your account and all associated data (available in Settings).</li>
            <li>Export your data (playlists, listening history).</li>
            <li>Opt out of public profile visibility.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">8. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. If you delete your account,
            all personal data (profile, playlists, history, likes) is permanently deleted within 30 days.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">9. Security</h2>
          <p>
            We implement industry-standard security measures including HTTPS encryption, Row Level Security (RLS)
            on all database tables, rate limiting on APIs, and secure file upload validation.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Contact</h2>
          <p>
            For privacy-related inquiries, contact us at{' '}
            <a href="mailto:dmca@music.rasyadazizan.site" className="text-[#FA243C] hover:text-[#ff3a50] transition-colors">
              dmca@music.rasyadazizan.site
            </a>.
          </p>
        </div>
      </section>
    </article>
  );
}
