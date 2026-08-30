import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Copy, Check, Truck, ShieldCheck, MapPin, Phone, User, Mail, AlertCircle, ShoppingBag } from 'lucide-react';
import { CartItem, StoreSettings } from '../types';
import { BD_DISTRICTS, getThanasForDistrict, SUB_DHAKA_AREAS } from '../data/bangladeshData';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  settings: StoreSettings;
  onOrderSuccess: (orderData: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  settings,
  onOrderSuccess,
}) => {
  if (!isOpen) return null;

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<'inside_dhaka' | 'sub_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [note, setNote] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Thana list based on district
  const thanaList = getThanasForDistrict(district);

  // Auto-select first thana if area not in list
  useEffect(() => {
    if (thanaList.length > 0 && (!area || !thanaList.includes(area))) {
      setArea(thanaList[0]);
    }
  }, [district]);

  // Auto-adjust delivery area based on district/thana
  useEffect(() => {
    if (district === 'Dhaka') {
      if (SUB_DHAKA_AREAS.includes(area)) {
        setDeliveryArea('sub_dhaka');
      } else {
        setDeliveryArea('inside_dhaka');
      }
    } else if (SUB_DHAKA_AREAS.includes(district)) {
      setDeliveryArea('sub_dhaka');
    } else {
      setDeliveryArea('outside_dhaka');
    }
  }, [district, area]);

  // Delivery charge calculation
  const getDeliveryCharge = () => {
    if (deliveryArea === 'inside_dhaka') {
      return Number(settings.delivery_inside_dhaka || 70);
    }
    if (deliveryArea === 'sub_dhaka') {
      return Number(settings.delivery_sub_dhaka || 100);
    }
    return Number(settings.delivery_outside_dhaka || 130);
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + Number(item.unit_price) * Number(item.quantity),
    0
  );
  const deliveryCharge = getDeliveryCharge();
  const grandTotal = subtotal + deliveryCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Phone validation
    const cleanedPhone = phone.replace(/[\s-]/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanedPhone)) {
      setErrorMessage('Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).');
      return;
    }

    if (!customerName.trim() || !address.trim() || !district || !area) {
      setErrorMessage('Please fill in all required fields (Name, Phone, District, Thana, Address).');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          phone: cleanedPhone,
          alt_phone: altPhone.trim(),
          email: email.trim(),
          district,
          area,
          address: address.trim(),
          delivery_area: deliveryArea,
          note: note.trim(),
          items: cart.map((item) => ({
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to place order.');
      }

      setCompletedOrder(data.order);
      onOrderSuccess(data.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderNumber = () => {
    if (completedOrder?.order_number) {
      navigator.clipboard.writeText(completedOrder.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-sm">
              MX
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-zinc-900">
                {completedOrder ? 'Order Confirmed' : 'Checkout & Cash on Delivery'}
              </h2>
              <p className="text-xs text-zinc-500">
                {completedOrder
                  ? 'Thank you for choosing Maxora'
                  : 'Fast delivery across all 64 districts of Bangladesh'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {completedOrder ? (
            /* Success State */
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-zinc-900 mb-1">
                  Order Successfully Placed!
                </h3>
                <p className="text-sm text-zinc-600 max-w-md mx-auto">
                  We have received your order. Our support team will call you shortly to confirm before dispatching.
                </p>
              </div>

              {/* Order Details Card */}
              <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200 text-left max-w-md mx-auto space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                  <span className="text-xs text-zinc-500 font-semibold">Order Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-zinc-900 text-sm">
                      {completedOrder.order_number}
                    </span>
                    <button
                      onClick={copyOrderNumber}
                      className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                      title="Copy order number"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-900">
                    ৳{completedOrder.subtotal?.toLocaleString('en-BD')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-zinc-900">
                    ৳{completedOrder.delivery_charge?.toLocaleString('en-BD')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 font-black text-zinc-950 text-base">
                  <span>Payable on Delivery</span>
                  <span className="text-emerald-700">
                    ৳{completedOrder.total?.toLocaleString('en-BD')}
                  </span>
                </div>

                <div className="bg-emerald-50 text-emerald-800 text-[11px] p-2.5 rounded-lg font-medium flex items-center gap-1.5 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Payment Method: Cash on Delivery (Pay upon arrival)</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-zinc-950 text-white text-xs sm:text-sm font-bold hover:bg-zinc-800 transition-colors shadow-md cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Order Summary Mini Box */}
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
                    Items in Order ({cart.reduce((a, b) => a + b.quantity, 0)})
                  </span>
                  <span>৳{subtotal.toLocaleString('en-BD')}</span>
                </div>

                <div className="max-h-24 overflow-y-auto divide-y divide-zinc-200/60 pr-1 text-xs text-zinc-600">
                  {cart.map((item) => (
                    <div key={item.product_id} className="py-1.5 flex justify-between items-center">
                      <span className="truncate max-w-[280px]">
                        {item.name} <span className="text-zinc-400 font-mono">x{item.quantity}</span>
                      </span>
                      <span className="font-semibold text-zinc-800">
                        ৳{(item.unit_price * item.quantity).toLocaleString('en-BD')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Customer Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Alternative Phone <span className="text-zinc-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Secondary contact number"
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value)}
                      className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Email Address <span className="text-zinc-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Delivery Location (Bangladesh)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      জেলা / District <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                      className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none font-medium"
                    >
                      {BD_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      থানা / Upazila <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      required
                      className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none font-medium"
                    >
                      {thanaList.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Delivery Area Rate Selector */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Delivery Zone <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={deliveryArea}
                    onChange={(e) => setDeliveryArea(e.target.value as any)}
                    className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none font-semibold"
                  >
                    <option value="inside_dhaka">
                      Inside Dhaka City — ৳{settings.delivery_inside_dhaka || 70}
                    </option>
                    <option value="sub_dhaka">
                      Dhaka Sub-Area (Gazipur, Savar, Narayanganj, Tongi, etc.) — ৳{settings.delivery_sub_dhaka || 100}
                    </option>
                    <option value="outside_dhaka">
                      Outside Dhaka (Nationwide) — ৳{settings.delivery_outside_dhaka || 130}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Detailed Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="House no, Road name, Block, Village, Landmark..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Order Note <span className="text-zinc-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call before delivery, deliver after 4 PM"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Breakdown & Payment Method */}
              <div className="bg-zinc-900 text-white p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">৳{subtotal.toLocaleString('en-BD')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    Delivery Charge ({deliveryArea === 'inside_dhaka' ? 'Dhaka City' : deliveryArea === 'sub_dhaka' ? 'Sub Dhaka' : 'Outside Dhaka'})
                  </span>
                  <span className="font-semibold text-white">৳{deliveryCharge.toLocaleString('en-BD')}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-base font-black">
                  <span>Grand Total (Pay on Delivery)</span>
                  <span className="text-emerald-400 text-xl">৳{grandTotal.toLocaleString('en-BD')}</span>
                </div>

                <div className="bg-zinc-800/80 p-2.5 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Payment Method: <strong>Cash on Delivery (No advance required)</strong></span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Placing Your Order...</span>
                ) : (
                  <>
                    <span>Confirm Order (৳{grandTotal.toLocaleString('en-BD')})</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
