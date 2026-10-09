import Link from "next/link";
import { GraduationCap, ArrowRight, Layers, ShieldCheck, Globe, Zap, Users2, LineChart } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="block text-lg font-bold tracking-tight text-white leading-tight">Northstar</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-semibold leading-tight">University</span>
            </div>
          </div>
          <div className="flex flex-items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="group relative px-6 py-2.5 text-sm font-medium bg-white text-slate-950 rounded-full hover:bg-indigo-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
            >
              <span className="flex items-center gap-2">
                Access Portal
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Next-Gen Campus Management
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Elevate your academic <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">
              infrastructure.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
            A unified, intelligent platform designed to streamline administration, empower educators, and enrich the student experience—all tailored for modern universities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 flex items-center justify-center gap-2"
            >
              Enter Workspace
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              Explore Features
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 border-t border-white/5 bg-slate-900/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Built for performance.</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Everything you need to manage your institution, from admissions and complex scheduling to real-time financial tracking.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Seamless Admissions",
                  desc: "Streamline student onboarding with automated application reviews and programmatic status transitions.",
                  icon: Layers,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10"
                },
                {
                  title: "Role-Based Security",
                  desc: "Enterprise-grade authorization ensuring students, teachers, and admins have precise access controls.",
                  icon: ShieldCheck,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10"
                },
                {
                  title: "Dynamic Curriculum",
                  desc: "Easily design programs, assign pre-requisites, and allocate resources across multiple departments.",
                  icon: Globe,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10"
                },
                {
                  title: "Real-time Tracking",
                  desc: "Instant insights on enrollments, financial collections, and campus activity through our live dashboard.",
                  icon: LineChart,
                  color: "text-indigo-400",
                  bg: "bg-indigo-500/10"
                },
                {
                  title: "Rapid Performance",
                  desc: "Optimized infrastructure delivering sub-second response times for complex queries and heavy loads.",
                  icon: Zap,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10"
                },
                {
                  title: "Faculty Empowerment",
                  desc: "Give teachers the tools they need to manage grades, publish exams, and handle class sessions effortlessly.",
                  icon: Users2,
                  color: "text-rose-400",
                  bg: "bg-rose-500/10"
                },
              ].map((feature, idx) => (
                <div key={idx} className="group p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </main>

      {/* Footer */ }
  <footer className="border-t border-white/5 py-12 relative z-10 backdrop-blur-lg mt-auto">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-5 h-5 text-indigo-500" />
        <span className="font-semibold text-slate-300">Northstar University</span>
      </div>
      <p className="text-slate-500 text-sm font-medium">
        © {new Date().getFullYear()} Northstar Systems. Premium software for education.
      </p>
    </div>
  </footer>
    </div >
  );
}
