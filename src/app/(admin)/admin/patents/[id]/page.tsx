// Admin: edit patent. Server component that fetches the patent record (plus its
// buyer inquiries) and passes them to the client PatentForm + an inquiries
// panel.
//
// Both heavy client components are loaded via the Lazy* client wrappers
// (next/dynamic, ssr:false) so the patent-form (32KB) + inquiries-panel chunks
// only compile on first navigation to this page. Server-fetched props are
// passed through unchanged.
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LazyPatentForm } from "@/components/admin/lazy-patent-form";
import { LazyPatentInquiriesPanel } from "@/components/admin/lazy-patent-inquiries-panel";

export default async function AdminPatentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patent, inquiries, inquiryCount] = await Promise.all([
    db.patent.findUnique({ where: { id } }),
    db.buyerInquiry.findMany({
      where: { patentId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        buyerName: true,
        buyerEmail: true,
        buyerPhone: true,
        message: true,
        budgetRange: true,
        intendedUse: true,
        status: true,
        createdAt: true,
      },
    }),
    db.buyerInquiry.count({ where: { patentId: id } }),
  ]);
  if (!patent) notFound();
  return (
    <div className="space-y-6">
      <LazyPatentInquiriesPanel
        patentId={id}
        total={inquiryCount}
        inquiries={inquiries.map((i) => ({
          ...i,
          createdAt: i.createdAt.toISOString(),
        }))}
      />
      <LazyPatentForm patent={patent} />
    </div>
  );
}
