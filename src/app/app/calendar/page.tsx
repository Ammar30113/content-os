import { PageHeader } from "@/components/page-header";

const calendarItems = [
  { day: "Mon", count: "2 posts", theme: "Product education" },
  { day: "Tue", count: "1 post", theme: "Customer story" },
  { day: "Wed", count: "3 posts", theme: "Launch support" },
  { day: "Thu", count: "1 post", theme: "Founder note" },
  { day: "Fri", count: "2 posts", theme: "Weekly roundup" },
];

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Planning"
        title="Calendar"
        description="A lightweight publishing calendar placeholder for upcoming content commitments."
      />
      <section className="p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-5">
          {calendarItems.map((item) => (
            <div
              key={item.day}
              className="min-h-44 rounded border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-slate-950">
                {item.day}
              </p>
              <p className="mt-4 text-2xl font-semibold text-teal-700">
                {item.count}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.theme}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
