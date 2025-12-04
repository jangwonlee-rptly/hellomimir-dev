import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-100 rounded-full blur-3xl opacity-20" style={{ animationDuration: "5s", animationDelay: "1s" }} />
      </div>

      {/* Hero section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Small eyebrow text */}
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full text-sm font-medium text-primary-700 animate-fade-in">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                Daily research, made simple
              </span>
            </div>

            {/* Main headline - big and bold */}
            <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none text-neutral-900 animate-fade-in-up">
              Stay curious.
              <br />
              <span className="text-primary-600">Stay informed.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl lg:text-2xl text-neutral-600 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              One research paper a day, explained in plain language.
              From cutting-edge AI to distant galaxies—complex ideas made accessible.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Link
                href="/fields"
                className="group inline-flex items-center justify-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary-700 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary-600/25"
              >
                Explore fields
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 bg-neutral-100 text-neutral-900 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-neutral-200 transition-all"
              >
                How it works
              </a>
            </div>
          </div>

          {/* Hero visual - decorative card stack */}
          <div className="lg:col-span-5 relative animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative w-full max-w-md mx-auto lg:max-w-none">
              {/* Stacked paper effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl rotate-3 opacity-20 blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-br from-accent-400 to-accent-600 rounded-3xl -rotate-2 opacity-15 blur-sm translate-y-2" />

              {/* Main card */}
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-neutral-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-neutral-200 rounded w-24 mb-2" />
                      <div className="h-2 bg-neutral-100 rounded w-32" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 rounded w-full" />
                    <div className="h-4 bg-neutral-200 rounded w-5/6" />
                    <div className="h-4 bg-neutral-200 rounded w-4/6" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <div className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      5th grade
                    </div>
                    <div className="px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-xs font-medium">
                      High school
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div id="how-it-works" className="relative bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-neutral-900 mb-4">
              How it works
            </h2>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
              Learning made simple in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary-200 rounded-2xl -z-10 group-hover:scale-110 transition-transform" />
              <div className="bg-neutral-50 rounded-3xl p-8 h-full border-2 border-neutral-200 hover:border-primary-300 transition-all group-hover:shadow-xl">
                <div className="w-14 h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center mb-6 font-display font-black text-2xl">
                  1
                </div>
                <h3 className="font-display font-bold text-2xl text-neutral-900 mb-3">
                  Pick your field
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Choose from AI, astrophysics, mathematics, biology, and more.
                  Follow what fascinates you.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-accent-200 rounded-2xl -z-10 group-hover:scale-110 transition-transform" />
              <div className="bg-neutral-50 rounded-3xl p-8 h-full border-2 border-neutral-200 hover:border-accent-300 transition-all group-hover:shadow-xl">
                <div className="w-14 h-14 bg-accent-600 text-white rounded-2xl flex items-center justify-center mb-6 font-display font-black text-2xl">
                  2
                </div>
                <h3 className="font-display font-bold text-2xl text-neutral-900 mb-3">
                  Read at your level
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Get explanations tailored to your understanding—from 5th grade
                  to high school. Same research, your language.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary-200 rounded-2xl -z-10 group-hover:scale-110 transition-transform" />
              <div className="bg-neutral-50 rounded-3xl p-8 h-full border-2 border-neutral-200 hover:border-primary-300 transition-all group-hover:shadow-xl">
                <div className="w-14 h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center mb-6 font-display font-black text-2xl">
                  3
                </div>
                <h3 className="font-display font-bold text-2xl text-neutral-900 mb-3">
                  Test yourself
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Quick quizzes help you remember what you learned.
                  Turn reading into real understanding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-neutral-900 text-neutral-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-2xl text-primary-500">
                hellomimir
              </span>
            </div>
            <p className="text-sm">
              Papers sourced from{" "}
              <a
                href="https://arxiv.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 transition-colors underline"
              >
                arXiv
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
