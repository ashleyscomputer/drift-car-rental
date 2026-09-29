import { ArrowLeft, CarFront } from 'lucide-react';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  return <main className="min-h-screen bg-[#f5f5f7] px-5 py-16 text-[#1d1d1f]">
    <section className="page-enter mx-auto max-w-lg rounded-[32px] bg-white p-8 shadow-sm sm:p-12">
      <a href="/" className="inline-flex items-center gap-2 text-sm text-black/55"><ArrowLeft className="size-4"/>Back to vehicles</a>
      <CarFront className="mt-10 size-10 text-[#0071e3]"/>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">{mode === 'register' ? 'Create your Drift account' : 'Sign in to Drift'}</h1>
      <p className="mt-4 leading-7 text-black/60">Account access is coming soon. You can still browse the fleet and try checkout as a guest.</p>
      <p className="mt-5 rounded-2xl bg-[#f5f5f7] p-4 text-sm text-black/55">Sign-in and registration will be available when account services are connected.</p>
      <a href="/#browse" className="mt-8 inline-flex rounded-full bg-[#0071e3] px-6 py-3 text-sm font-medium text-white">Continue as guest</a>
    </section>
  </main>;
}
