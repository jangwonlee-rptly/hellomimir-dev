import { getFields } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import FieldCard from "@/components/FieldCard";
import type { Field } from "@/types";

export const dynamic = "force-dynamic";

export default async function FieldsPage() {
  let fields: Field[] = [];
  let error: string | null = null;

  try {
    fields = await getFields();
  } catch (e) {
    console.error("Error loading fields:", e);
    error = "Failed to load fields. Please try again later.";
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-50">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent-100 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header section */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-neutral-900 mb-4">
              Choose your field
            </h1>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
              Explore today&apos;s latest research across different domains
            </p>
          </div>

          {/* Fields grid */}
          {error ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 rounded-2xl">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-block p-8 bg-white rounded-3xl shadow-lg border-2 border-neutral-200">
                <svg className="w-16 h-16 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-neutral-600 font-medium">No fields available yet.</p>
                <p className="text-neutral-500 text-sm mt-2">Check back soon for new content!</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field, index) => (
                <FieldCard key={field.id} field={field} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
