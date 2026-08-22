import { Receipt } from "lucide-react";

import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";

type BillDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = await params;

  return (
    <FeaturePlaceholder
      description={`View line items and payment details for bill ${id}.`}
      icon={Receipt}
      title="Bill details"
    />
  );
}
