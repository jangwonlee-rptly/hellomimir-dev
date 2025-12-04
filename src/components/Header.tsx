import Link from "next/link";

interface HeaderProps {
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
}

export default function Header({
  showBackLink = false,
  backHref = "/",
  backLabel = "Back",
}: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          {showBackLink && (
            <Link
              href={backHref}
              className="group flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm font-medium">{backLabel}</span>
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display font-bold text-2xl text-primary-600 group-hover:text-primary-700 transition-colors">
              hellomimir
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/fields"
            className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors px-4 py-2 rounded-xl hover:bg-primary-50"
          >
            All Fields
          </Link>
        </nav>
      </div>
    </header>
  );
}
