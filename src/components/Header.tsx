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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackLink && (
            <Link
              href={backHref}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm">{backLabel}</span>
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">
              hellomimir
            </span>
          </Link>
        </div>
        <nav>
          <Link
            href="/fields"
            className="text-sm text-gray-600 hover:text-primary-600"
          >
            All Fields
          </Link>
        </nav>
      </div>
    </header>
  );
}
