"use client";

import { PromotionDataProvider } from "./PromotionDataProvider";
import { PromotionManagement } from "./PromotionManagement";

export default function PromotionPage() {
  return (
    <PromotionDataProvider>
      <PromotionManagement />
    </PromotionDataProvider>
  );
}