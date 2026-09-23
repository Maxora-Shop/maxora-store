import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, X, ShoppingBag, Flame } from 'lucide-react';
import { Product } from '../types';

interface LiveSalesNotificationProps {
  products: Product[];
  onSelectProduct?: (product: Product) => void;
  enabled?: boolean;
}

interface SaleNotification {
  id: string;
  customerName: string;
  location: string;
  timeAgo: string;
  product: Product;
}

const BD_NAMES = [
  'Md. Rahim',
  'Tanvir Ahmed',
  'Fahim Shahriar',
  'Sumaiya Akter',
  'Sadia Islam',
  'Mehedi Hasan',
  'Ashiqur Rahman',
  'Sabbir Hossain',
  'Jannatul Ferdous',
  'Shakil Ahmed',
  'Nasir Uddin',
  'Mahmudul Hasan',
  'Farhana Yeasmin',
  'Kamrul Islam',
  'Ariful Haque',
];

const BD_LOCATIONS = [
  'Mirpur, Dhaka',
  'Uttara, Dhaka',
  'Dhanmondi, Dhaka',
  'Gulshan, Dhaka',
  'Chittagong',
  'Sylhet Sadar',
  'Rajshahi',
  'Khulna Sadar',
  'Bogura',
  'Cumilla',
  'Gazipur',
  'Narayanganj',
  'Barisal',
  'Mymensingh',
  'Rangpur',
];

const TIME_AGOS = [
  'এইমাত্র (Just now)',
  '২ মিনিট আগে',
  '৪ মিনিট আগে',
  '৭ মিনিট আগে',
  '১১ মিনিট আগে',
  '১৫ মিনিট আগে',
  '২২ মিনিট আগে',
];

export const LiveSalesNotification: React.FC<LiveSalesNotificationProps> = ({
  products,
  onSelectProduct,
  enabled = true,
}) => {
  const [currentNotification, setCurrentNotification] = useState<SaleNotification | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active products pool
  const activeProducts = products.filter(
    (p) => p.active !== 0 && String(p.active) !== '0' && p.name && (p.image_url || (p.images && p.images[0]))
  );

  const triggerNextNotification = () => {
    if (isDismissed || !enabled || activeProducts.length === 0 || isHovered) return;

    // Pick random product, name, location, time
    const randomProduct = activeProducts[Math.floor(Math.random() * activeProducts.length)];
    const randomName = BD_NAMES[Math.floor(Math.random() * BD_NAMES.length)];
    const randomLoc = BD_LOCATIONS[Math.floor(Math.random() * BD_LOCATIONS.length)];
    const randomTime = TIME_AGOS[Math.floor(Math.random() * TIME_AGOS.length)];

    setCurrentNotification({
      id: `toast-${Date.now()}`,
      customerName: randomName,
      location: randomLoc,
      timeAgo: randomTime,
      product: randomProduct,
    });
    setIsVisible(true);

    // Auto-hide after 5.5 seconds
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5500);
  };

  useEffect(() => {
    if (!enabled || activeProducts.length === 0 || isDismissed) {
      setIsVisible(false);
      return;
    }

    // Initial popup after 4 seconds of entering site
    const initialDelay = setTimeout(() => {
      triggerNextNotification();
    }, 4000);

    // Recurring interval every 14-20 seconds
    const interval = setInterval(() => {
      triggerNextNotification();
    }, 16000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [enabled, activeProducts.length, isDismissed, isHovered]);

  if (!enabled || isDismissed || !currentNotification) {
    return null;
  }

  const { customerName, location, timeAgo, product } = currentNotification;
  const sellingPrice = Number(product.selling_price || 0);
  const discount = Number(product.discount || 0);
  const finalPrice = Math.max(0, sellingPrice - discount);
  const imageSrc =
    product.image_url || (product.images && product.images[0]) || '';

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setIsDismissed(true);
    // Un-dismiss after 4 minutes so user gets fresh notifications later if still browsing
    setTimeout(() => {
      setIsDismissed(false);
    }, 240000);
  };

  const handleClick = () => {
    if (onSelectProduct && product) {
      onSelectProduct(product);
      setIsVisible(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed bottom-20 sm:bottom-6 left-3 sm:left-6 z-40 transition-all duration-500 ease-out transform ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
          : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div
        onClick={handleClick}
        className="group relative bg-white/95 backdrop-blur-md border border-zinc-200/90 shadow-xl hover:shadow-2xl rounded-2xl p-2.5 sm:p-3 pr-8 flex items-center gap-3 max-w-[320px] sm:max-w-[360px] cursor-pointer transition-all hover:border-amber-300 ring-1 ring-black/5"
      >
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
          title="Close notification"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Product Thumbnail */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-zinc-50 border border-zinc-100 p-1 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-300">
              <ShoppingBag className="w-6 h-6" />
            </div>
          )}
          {Number(product.sold_count || 0) > 0 && (
            <span className="absolute bottom-0.5 right-0.5 bg-amber-500 text-white p-0.5 rounded-full shadow-2xs">
              <Flame className="w-2.5 h-2.5 fill-white" />
            </span>
          )}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[11px] sm:text-xs font-black text-zinc-900 truncate">
              {customerName}
            </span>
            <span className="text-[10px] text-zinc-400">({location})</span>
          </div>

          <p className="text-[10px] text-emerald-800 font-bold flex items-center gap-1 mb-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-700 fill-emerald-100 shrink-0" />
            <span>এইমাত্র অর্ডার করেছেন</span>
          </p>

          <p className="text-[11px] font-bold text-zinc-800 line-clamp-1 truncate group-hover:text-amber-700 transition-colors">
            {product.name}
          </p>

          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="font-black text-rose-600 sm:text-[11px]">
              ৳{finalPrice.toLocaleString('en-BD')}
            </span>
            <span className="text-zinc-400 text-[9px] font-medium">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
