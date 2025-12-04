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
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Choose a Field</h1>
          <p className="text-gray-600 mt-2">
            Select a field to see today&apos;s paper
          </p>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No fields available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {fields.map((field) => (
              <FieldCard key={field.id} field={field} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
