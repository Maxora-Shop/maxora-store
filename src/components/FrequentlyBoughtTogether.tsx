import React, { useState, useMemo } from 'react';
import { Plus, Check, ShoppingBag, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface FrequentlyBoughtTogetherProps {
  mainProduct: Product;
  allProducts: Product[];
  onAddBundleToCart: (products: Product[]) => void;
  onSelectProduct: (product: Product) => void;
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  mainProduct,
  allProducts,
  onAddBundleToCart,
  onSelectProduct,
}) => {
  // Find 1 or 2 complementary products
  const complementaryProducts = useMemo(() => {
    // Look for other products in same category/subcategory
    const sameCategory = allProducts.filter(
      (p) =>
        p.id !== mainProduct.id &&
        (p.category === mainProduct.category ||
          (mainProduct.sub_category && p.sub_category === mainProduct.sub_category))
    );

    if (sameCategory.length >= 2) {
      return sameCategory.slice(0, 2);
    }

    // Look for accessories, lifestyle, or popular items
    const otherProducts = allProducts.filter(
      (p) => p.id !== mainProduct.id && !sameCategory.includes(p)
    );

    return [...sameCategory, ...otherProducts].slice(0, 2);
  }, [allProducts, mainProduct]);

  // Track checked IDs
  const [selectedIds, setSelectedIds] = useState<string[]>([
    mainProduct.id,
    ...(complementaryProducts[0] ? [complementaryProducts[0].id] : []),
  ]);

  const [isAddedToast, setIsAddedToast] = useState(false);

  // If no complementary items available, hide section
  if (complementaryProducts.length === 0) {
    return null;
  }

  const allBundleCandidates = [mainProduct, ...complementaryProducts];

  const handleToggle = (prodId: string) => {
    // Main product can't be toggled off to ensure it's always part of the deal
    if (prodId === mainProduct.id) return;

    if (selectedIds.includes(prodId)) {
      setSelectedIds(selectedIds.filter((id) => id !== prodId));
    } else {
      setSelectedIds([...selectedIds, prodId]);
    }
  };

  const selectedProducts = allBundleCandidates.filter((p) => selectedIds.includes(p.id));

  // Compute pricing
  const totalRegularPrice = selectedProducts.reduce((sum, p) => {
    return sum + (Number(p.selling_price) || 0);
  }, 0);

  // Instant combo bundle discount (৳120 off when 2 items selected, ৳220 off when 3 items selected)
  const comboDiscount = selectedProducts.length >= 3 ? 220 : selectedProducts.length === 2 ? 120 : 0;

  const totalFinalPrice = Math.max(
    0,
    selectedProducts.reduce((sum, p) => {
      const price = Number(p.final_price) || (Number(p.selling_price) - (Number(p.discount) || 0));
      return sum + price;
    }, 0) - comboDiscount
  );

  const totalSaved = totalRegularPrice - totalFinalPrice;

  const handleAddToCart = () => {
    if (selectedProducts.length === 0) return;
    onAddBundleToCart(selectedProducts);
    setIsAddedToast(true);
    setTimeout(() => setIsAddedToast(false), 2500);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-amber-500/5 via-white to-zinc-50 border border-amber-200/80 shadow-xs p-4 sm:p-7 space-y-6">
      {/* Title & Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-zinc-950" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-zinc-950 flex items-center gap-2">
              <span>Frequently Bought Together (প্রায়শই একসাথে কেনা হয়)</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 shadow-2xs">
                Combo Offer
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 font-medium">
              একসাথে কিনে অতিরিক্ত স্পেশাল কম্বো ডিসকাউন্ট উপভোগ করুন
            </p>
          </div>
        </div>

        {comboDiscount > 0 && (
          <div className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 animate-pulse">
            🔥 কম্বো অফারে অতিরিক্ত ৳{comboDiscount} সাশ্রয়!
          </div>
        )}
      </div>

      {/* Main Bundle Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Products Visual Carousel / Chain */}
        <div className="lg:col-span-8 flex flex-col sm:flex-row items-center gap-3 overflow-x-auto pb-2">
          {allBundleCandidates.map((prod, idx) => {
            const isMain = prod.id === mainProduct.id;
            const isChecked = selectedIds.includes(prod.id);
            const price = Number(prod.final_price) || (Number(prod.selling_price) - (Number(prod.discount) || 0));

            return (
              <React.Fragment key={prod.id}>
                {idx > 0 && (
                  <div className="w-8 h-8 rounded-full bg-zinc-200/80 text-zinc-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                {/* Product Mini Card */}
                <div
                  className={`relative flex-1 min-w-[200px] max-w-[240px] p-3 rounded-2xl bg-white border transition-all ${
                    isChecked
                      ? 'border-amber-400 shadow-sm ring-2 ring-amber-400/20'
                      : 'border-zinc-200 opacity-60'
                  }`}
                >
                  {/* Top Checkbox / Indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-zinc-700">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isMain}
                        onChange={() => handleToggle(prod.id)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer accent-amber-500"
                      />
                      <span>{isMain ? 'This item (এই পণ্য)' : 'Add this (যোগ করুন)'}</span>
                    </label>

                    {isMain && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-zinc-950 text-emerald-400">
                        Main
                      </span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div
                    onClick={() => !isMain && onSelectProduct(prod)}
                    className={`aspect-square w-full rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center p-2 mb-2 ${
                      !isMain ? 'cursor-pointer hover:bg-zinc-100' : ''
                    }`}
                  >
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Title & Price */}
                  <div className="space-y-1">
                    <h4
                      onClick={() => !isMain && onSelectProduct(prod)}
                      className={`text-xs font-bold text-zinc-900 line-clamp-2 leading-tight ${
                        !isMain ? 'hover:text-emerald-700 cursor-pointer' : ''
                      }`}
                      title={prod.name}
                    >
                      {prod.name}
                    </h4>
                    <div className="flex items-baseline gap-1.5 pt-0.5">
                      <span className="text-xs font-black text-zinc-950">
                        ৳{price.toLocaleString('en-BD')}
                      </span>
                      {Number(prod.discount || 0) > 0 && (
                        <span className="text-[10px] text-zinc-400 line-through">
                          ৳{Number(prod.selling_price).toLocaleString('en-BD')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Pricing Summary & Action Card */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-white border border-amber-300 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
              <span>নির্বাচিত পণ্য ({selectedProducts.length}টি):</span>
              <span className="line-through text-zinc-400 font-bold">
                ৳{totalRegularPrice.toLocaleString('en-BD')}
              </span>
            </div>

            {totalSaved > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-600 font-bold">
                <span>মোট সাশ্রয়:</span>
                <span>-৳{totalSaved.toLocaleString('en-BD')}</span>
              </div>
            )}

            <div className="flex items-baseline justify-between pt-2 border-t border-zinc-100">
              <span className="text-xs font-extrabold text-zinc-800">কম্বো মোট মূল্য:</span>
              <span className="text-2xl font-black text-zinc-950">
                ৳{totalFinalPrice.toLocaleString('en-BD')}
              </span>
            </div>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={selectedProducts.length === 0}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 ${
              isAddedToast
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-950 hover:bg-emerald-600 text-white'
            }`}
          >
            {isAddedToast ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Added Combo to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>
                  Add {selectedProducts.length > 1 ? 'Both' : 'Selected'} to Cart ({selectedProducts.length}টি পণ্য যোগ করুন)
                </span>
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-zinc-500 font-medium">
            ✓ ক্যাশ অন ডেলিভারি ও দ্রুত ডেলিভারির সুবিধা প্রযোজ্য
          </p>
        </div>
      </div>
    </div>
  );
};
