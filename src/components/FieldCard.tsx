import Link from "next/link";
import type { Field } from "@/types";

interface FieldCardProps {
  field: Field;
  index?: number;
}

const gradients = [
  "from-primary-400 to-primary-600",
  "from-accent-400 to-accent-600",
  "from-primary-500 to-accent-500",
  "from-accent-500 to-primary-500",
];

export default function FieldCard({ field, index = 0 }: FieldCardProps) {
  const gradient = gradients[index % gradients.length];

  return (
    <Link
      href={`/field/${field.slug}`}
      className="group relative bg-white rounded-3xl shadow-lg border-2 border-neutral-200 overflow-hidden hover:shadow-2xl hover:border-primary-300 transition-all hover:-translate-y-1"
    >
      {/* Decorative gradient bar */}
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />

      {/* Card content */}
      <div className="p-6 sm:p-8">
        {/* Field name */}
        <h3 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors">
          {field.name}
        </h3>

        {/* Description */}
        {field.description && (
          <p className="text-neutral-600 text-base leading-relaxed mb-6">
            {field.description}
          </p>
        )}

        {/* CTA */}
        <div className="flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all">
          <span>View today&apos;s paper</span>
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
        </div>
      </div>

      {/* Decorative corner element */}
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`} />
    </Link>
  );
}
