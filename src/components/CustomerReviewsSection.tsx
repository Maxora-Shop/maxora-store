import React from 'react';
import { Star, CheckCircle, Quote, ThumbsUp } from 'lucide-react';

export const CustomerReviewsSection: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Tanvir Ahmed',
      location: 'Dhanmondi, Dhaka',
      rating: 5,
      date: '2 days ago',
      product: 'Ultra Smart Watch AMOLED',
      text: 'অর্ডার করার পরের দিনই ডেলিভারি পেয়েছি। প্রোডাক্টের বিল্ড কোয়ালিটি এবং ডিসপ্লে দারুণ! ক্যাশ অন ডেলিভারিতে চেক করে পেমেন্ট করার সুবিধা খুব ভালো লেগেছে।',
    },
    {
      id: 2,
      name: 'Sabrina Rahman',
      location: 'Nasirabad, Chattogram',
      rating: 5,
      date: '4 days ago',
      product: 'Wireless ANC Pro Earbuds',
      text: 'Original sound quality and active noise cancellation is top notch. ব্যাটারি ব্যাকআপ এক কথায় অসাধারণ। Maxora Shop BD সত্যিই বিশ্বস্ত!',
    },
    {
      id: 3,
      name: 'Mehedi Hasan',
      location: 'Zindabazar, Sylhet',
      rating: 5,
      date: '1 week ago',
      product: 'Anti-Theft Laptop Backpack',
      text: 'ঢাকার বাইরে থেকেও মাত্র ২ দিনের মধ্যে ডেলিভারি পেয়েছি। প্যাকেজিং খুব সুন্দর এবং নিখুঁত ছিল। ১০০% রেকমেন্ডেড শপ!',
    },
    {
      id: 4,
      name: 'Farhan Kabir',
      location: 'Uttara, Dhaka',
      rating: 5,
      date: '1 week ago',
      product: 'RGB Mechanical Gaming Keyboard',
      text: 'কাস্টমার সার্ভিস টিম অনেক হেল্পফুল ছিল। প্রোডাক্ট ১০০% অরিজিনাল। এমন দারুণ সার্ভিসের জন্য ধন্যবাদ Maxora টীমকে!',
    },
  ];

  return (
    <section className="my-8 sm:my-12 w-full">
      <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 mb-2">
          <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
          <span>Real Experiences</span>
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-zinc-950 tracking-tight">
          What Our Customers Say
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
          Trusted by thousands of happy online shoppers across all 64 districts of Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Rating & Quote */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="w-5 h-5 text-zinc-300" />
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium mb-4 italic">
                "{t.text}"
              </p>
            </div>

            {/* Customer info & Verified badge */}
            <div className="pt-3 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-zinc-950 leading-snug">
                    {t.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">
                    {t.location}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Verified Buyer</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
