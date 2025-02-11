// app/admin/promotions/page.tsx
import { getPromotions, getCategories, getProductsForPromotions } from "@/server/actions"
import { PromotionManagement } from "@/components/PromotionManagement"

export default async function PromotionsPage() {
  const [promotionsResult, productsResult, categoriesResult] = await Promise.all([
    getPromotions(),
    getProductsForPromotions(),
    getCategories(),
  ])

  if (!promotionsResult.success || !productsResult.success || !categoriesResult.success) {
    return <div>Error loading data</div>
  }

  return (
    <div>
      <PromotionManagement
        initialPromotions={promotionsResult.data}
        products={productsResult.data}
        categories={categoriesResult.data}
      />
    </div>
  )
}