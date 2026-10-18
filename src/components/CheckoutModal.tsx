import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Copy, Check, Truck, ShieldCheck, MapPin, Phone, User, Mail, AlertCircle, ShoppingBag, Sparkles, CreditCard, Banknote, ExternalLink, Landmark } from 'lucide-react';
import { CartItem, StoreSettings } from '../types';
import { BD_DISTRICTS, getThanasForDistrict, SUB_DHAKA_AREAS } from '../data/bangladeshData';
import { storeService } from '../services/storeService';

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
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online' | 'manual_bkash' | 'manual_nagad' | 'manual_bank'>('cod');
  const [manualSenderNumber, setManualSenderNumber] = useState('');
  const [manualTrxId, setManualTrxId] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState<boolean>(true);
  const [fallbackPendingOrder, setFallbackPendingOrder] = useState<any>(null);

  const handleCopyAccount = (numberToCopy: string, label: string) => {
    if (!numberToCopy) return;
    navigator.clipboard.writeText(numberToCopy);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  // Check online payment gateway availability
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    storeService.getPaymentConfig().then((cfg) => {
      if (!isMounted) return;
      const uddokta = cfg.methods?.find((m) => m.id === 'uddoktapay');
      const isOnlineActive = Boolean(uddokta && uddokta.enabled);
      setOnlinePaymentEnabled(isOnlineActive);
      if (!isOnlineActive && paymentMethod === 'online') {
        setPaymentMethod('cod');
      }
    }).catch(() => {
      if (isMounted) setOnlinePaymentEnabled(false);
    });
    return () => { isMounted = false; };
  }, [isOpen]);

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

  // Free delivery toggle & threshold from store settings (Admin controlled)
  const isFreeDeliveryFeatureEnabled = settings.free_delivery_enabled === true;
  const FREE_SHIPPING_THRESHOLD =
    Number(settings.free_delivery_threshold) > 0 ? Number(settings.free_delivery_threshold) : 2000;

  const subtotal = cart.reduce(
    (acc, item) => acc + Number(item.unit_price) * Number(item.quantity),
    0
  );

  const isFreeShipping = isFreeDeliveryFeatureEnabled && subtotal >= FREE_SHIPPING_THRESHOLD;

  // Delivery charge calculation (0 if free shipping unlocked)
  const getDeliveryCharge = () => {
    if (isFreeShipping) return 0;
    if (deliveryArea === 'inside_dhaka') {
      return Number(settings.delivery_inside_dhaka || 70);
    }
    if (deliveryArea === 'sub_dhaka') {
      return Number(settings.delivery_sub_dhaka || 100);
    }
    return Number(settings.delivery_outside_dhaka || 130);
  };

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

    // Direct manual payment verification
    if (paymentMethod === 'manual_bkash' || paymentMethod === 'manual_nagad' || paymentMethod === 'manual_bank') {
      if (!manualTrxId.trim() && !manualSenderNumber.trim()) {
        setErrorMessage(
          paymentMethod === 'manual_bkash'
            ? 'অনুগ্রহ করে বিকাশ পেমেন্টের ট্রানজেকশন আইডি (TrxID) অথবা আপনার প্রেরক বিকাশ নম্বর প্রদান করুন।'
            : paymentMethod === 'manual_nagad'
            ? 'অনুগ্রহ করে নগদ পেমেন্টের ট্রানজেকশন আইডি (TrxID) অথবা আপনার প্রেরক নগদ নম্বর প্রদান করুন।'
            : 'অনুগ্রহ করে ব্যাংক ট্রান্সফারের ডিপোজিট স্লিপ / রেফারেন্স নম্বর অথবা অ্যাকাউন্ট নাম প্রদান করুন।'
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const isOnline = paymentMethod === 'online';
      const bkashNum = settings.manual_bkash_number || '01844932809';
      const bkashType = settings.manual_bkash_type || 'Personal';
      const nagadNum = settings.manual_nagad_number || '01844932809';
      const nagadType = settings.manual_nagad_type || 'Personal';
      const bankName = settings.manual_bank_name || 'The City Bank Ltd.';
      const bankAcctNum = settings.manual_bank_account_number || '';

      let finalPaymentMethod = 'Cash on Delivery';
      let finalPaymentGateway = 'cod';
      let finalTrxId = '';

      if (isOnline) {
        finalPaymentMethod = 'Online Payment (UddoktaPay)';
        finalPaymentGateway = 'uddoktapay';
      } else if (paymentMethod === 'manual_bkash') {
        finalPaymentMethod = `bKash Direct (${bkashType}: ${bkashNum})`;
        finalPaymentGateway = 'manual_bkash';
        finalTrxId = manualTrxId.trim() || manualSenderNumber.trim();
      } else if (paymentMethod === 'manual_nagad') {
        finalPaymentMethod = `Nagad Direct (${nagadType}: ${nagadNum})`;
        finalPaymentGateway = 'manual_nagad';
        finalTrxId = manualTrxId.trim() || manualSenderNumber.trim();
      } else if (paymentMethod === 'manual_bank') {
        finalPaymentMethod = `Bank Transfer (${bankName})`;
        finalPaymentGateway = 'manual_bank';
        finalTrxId = manualTrxId.trim() || manualSenderNumber.trim();
      }

      const result = await storeService.createOrder({
        customer_name: customerName.trim(),
        phone: cleanedPhone,
        alt_phone: altPhone.trim(),
        email: email.trim(),
        district,
        area,
        address: address.trim(),
        delivery_area: deliveryArea,
        delivery_charge: deliveryCharge,
        subtotal,
        total: grandTotal,
        note: note.trim(),
        payment_method: finalPaymentMethod,
        payment_status: 'Pending',
        payment_gateway: finalPaymentGateway,
        transaction_id: finalTrxId,
        payment_details: {
          method: paymentMethod,
          sender_number: manualSenderNumber.trim(),
          trx_id: manualTrxId.trim(),
          recipient_account: paymentMethod === 'manual_bkash' ? bkashNum : paymentMethod === 'manual_nagad' ? nagadNum : bankAcctNum,
        },
        items: cart.map((item) => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          selected_color: item.selected_color,
          selected_color_code: item.selected_color_code,
          image_url: item.image_url,
          unit_price: item.unit_price,
          sku: item.sku,
        })),
      });

      if (!result.success || !result.order) {
        throw new Error(result.error || 'Failed to place order.');
      }

      // If Online Payment (bKash/Nagad/Rocket), initiate UddoktaPay session
      if (isOnline) {
        const payInit = await storeService.initiateUddoktaPay({
          order_id: result.order.id,
          order_number: result.order.order_number,
          amount: grandTotal,
          customer_name: customerName.trim(),
          phone: cleanedPhone,
          email: email.trim(),
        });

        if (payInit.success && payInit.payment_url) {
          // Notify app to clear cart or record pending state
          onOrderSuccess(result.order);
          // Redirect customer to UddoktaPay hosted payment page
          window.location.href = payInit.payment_url;
          return;
        } else {
          setFallbackPendingOrder(result.order);
          throw new Error(
            payInit.error || 'অনলাইন পেমেন্ট গেটওয়েতে সংযোগ করতে সমস্যা হচ্ছে। আপনার অর্ডারটি সুরক্ষিত আছে! আপনি নিচের বাটনে ক্লিক করে ক্যাশ অন ডেলিভারিতে অর্ডারটি কনফার্ম করতে পারেন।'
          );
        }
      }

      // Cash on Delivery flow
      setCompletedOrder(result.order);
      onOrderSuccess(result.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToCodFallback = async () => {
    if (!fallbackPendingOrder) return;
    try {
      setIsSubmitting(true);
      await storeService.updateOrder({
        id: fallbackPendingOrder.id,
        payment_method: 'Cash on Delivery (COD)',
        payment_status: 'Pending',
      });
      const finalOrder = {
        ...fallbackPendingOrder,
        payment_method: 'Cash on Delivery (COD)',
        payment_status: 'Pending',
      };
      setCompletedOrder(finalOrder);
      onOrderSuccess(finalOrder);
      setErrorMessage('');
      setFallbackPendingOrder(null);
    } catch {
      setCompletedOrder(fallbackPendingOrder);
      onOrderSuccess(fallbackPendingOrder);
      setErrorMessage('');
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-4 bg-zinc-950/70 backdrop-blur-sm">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-sm shrink-0">
              MX
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-base sm:text-lg text-zinc-900 truncate">
                {completedOrder ? 'Order Confirmed' : 'Checkout & Cash on Delivery'}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
                {completedOrder
                  ? 'Thank you for choosing Maxora'
                  : 'Fast delivery across all 64 districts of Bangladesh'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
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
                  {Number(completedOrder.delivery_charge || 0) === 0 ? (
                    <span className="font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-xs">
                      ৳0 (FREE DELIVERY)
                    </span>
                  ) : (
                    <span className="font-semibold text-zinc-900">
                      ৳{Number(completedOrder.delivery_charge).toLocaleString('en-BD')}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 font-black text-zinc-950 text-base">
                  <span>{completedOrder.payment_method?.includes('Cash') ? 'Payable on Delivery' : 'Total Amount'}</span>
                  <span className="text-emerald-700">
                    ৳{completedOrder.total?.toLocaleString('en-BD')}
                  </span>
                </div>

                <div className="bg-emerald-50 text-emerald-800 text-[11px] p-2.5 rounded-xl font-medium space-y-1 border border-emerald-200">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Payment Method: {completedOrder.payment_method || 'Cash on Delivery'}</span>
                  </div>
                  {completedOrder.transaction_id && (
                    <div className="text-[11px] text-emerald-950 font-mono bg-white/80 px-2 py-1 rounded border border-emerald-200">
                      TrxID / Reference: <strong>{completedOrder.transaction_id}</strong>
                    </div>
                  )}
                </div>

                {/* Customer Delivery Assurance */}
                <div className="bg-white border border-emerald-200 rounded-xl p-3 text-left text-xs text-emerald-950 space-y-1 shadow-2xs">
                  <div className="font-extrabold flex items-center gap-1.5 text-emerald-800 text-[11px]">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>দ্রুত ডেলিভারি আপডেট:</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার ঠিকানায় পার্সেলটি পৌঁছে দিতে যোগাযোগ করবেন।
                  </p>
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
              {/* Quick Trust Banner inside Checkout */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-emerald-950 truncate">
                      ১০০% ক্যাশ অন ডেলিভারি (Cash on Delivery)
                    </p>
                    <p className="text-[11px] text-emerald-800/90 font-medium truncate">
                      ডেলিভারিম্যানের কাছ থেকে পণ্য বুঝে পেয়ে পেমেন্ট করুন
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-2.5 py-1 rounded-full shrink-0">
                  Verified Order
                </span>
              </div>

              {errorMessage && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2.5 animate-fade-in shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-bold leading-relaxed">{errorMessage}</span>
                  </div>
                  {fallbackPendingOrder && (
                    <div className="pt-2 border-t border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-rose-100/50 p-2.5 rounded-xl">
                      <span className="text-[11px] font-semibold text-rose-900">
                        অর্ডার নং: <strong>{fallbackPendingOrder.order_number}</strong> সংরক্ষিত হয়েছে। ক্যাশ অন ডেলিভারিতে কনফার্ম করবেন?
                      </span>
                      <button
                        type="button"
                        onClick={handleSwitchToCodFallback}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50"
                      >
                        ✓ ক্যাশ অন ডেলিভারিতে কনফার্ম করুন
                      </button>
                    </div>
                  )}
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
                  {cart.map((item, idx) => (
                    <div key={`${item.product_id}-${item.selected_color || idx}`} className="py-1.5 flex justify-between items-center">
                      <div className="truncate max-w-[280px]">
                        <span className="font-medium text-zinc-900">{item.name}</span>
                        {item.selected_color && (
                          <span className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.2 rounded bg-zinc-200/80 text-[10px] font-semibold text-zinc-800">
                            {item.selected_color_code && (
                              <span className="w-2 h-2 rounded-full inline-block border border-white" style={{ backgroundColor: item.selected_color_code }} />
                            )}
                            {item.selected_color}
                          </span>
                        )}
                        <span className="text-zinc-400 font-mono ml-1.5">x{item.quantity}</span>
                      </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-zinc-700">
                      Delivery Zone <span className="text-rose-500">*</span>
                    </label>
                    {isFreeShipping && (
                      <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Free Delivery Unlocked!
                      </span>
                    )}
                  </div>
                  <select
                    value={deliveryArea}
                    onChange={(e) => setDeliveryArea(e.target.value as any)}
                    className="w-full bg-zinc-50 focus:bg-white text-zinc-900 text-xs sm:text-sm p-3 rounded-xl border border-zinc-300 focus:border-zinc-900 focus:outline-none font-semibold"
                  >
                    <option value="inside_dhaka">
                      Inside Dhaka City — {isFreeShipping ? '৳0 (Free Delivery)' : `৳${settings.delivery_inside_dhaka || 70}`}
                    </option>
                    <option value="sub_dhaka">
                      Dhaka Sub-Area (Gazipur, Savar, Keraniganj, Tongi, etc.) — {isFreeShipping ? '৳0 (Free Delivery)' : `৳${settings.delivery_sub_dhaka || 100}`}
                    </option>
                    <option value="outside_dhaka">
                      Outside Dhaka (Nationwide) — {isFreeShipping ? '৳0 (Free Delivery)' : `৳${settings.delivery_outside_dhaka || 130}`}
                    </option>
                  </select>
                </div>

                {isFreeShipping && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3 flex items-center gap-2 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>🎉 সাবটোটাল ৳{FREE_SHIPPING_THRESHOLD.toLocaleString('en-BD')}+ হওয়ায় ডেলিভারি চার্জ সম্পূর্ণ ফ্রি (৳0)!</span>
                  </div>
                )}

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

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    পেমেন্ট মেথড নির্বাচন করুন
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">১০০% নিরাপদ ও সুরক্ষিত</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Cash on Delivery (COD) */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          paymentMethod === 'cod'
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-extrabold text-xs sm:text-sm text-zinc-900">
                            Cash on Delivery (COD)
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 shrink-0">
                            ক্যাশ
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-tight">
                          পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধ করুন। কোনো অগ্রিম ছাড়াই।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: bKash Direct */}
                  {settings.manual_bkash_enabled !== false && (
                    <div
                      onClick={() => setPaymentMethod('manual_bkash')}
                      className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'manual_bkash'
                          ? 'border-[#e2136e] bg-pink-50/60 ring-2 ring-[#e2136e]/20 shadow-xs'
                          : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            paymentMethod === 'manual_bkash'
                              ? 'border-[#e2136e] bg-[#e2136e]'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {paymentMethod === 'manual_bkash' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-extrabold text-xs sm:text-sm text-zinc-900 flex items-center gap-1.5">
                              <span>বিকাশ (bKash)</span>
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#e2136e] text-white shrink-0">
                              bKash
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-tight">
                            সরাসরি বিকাশ নম্বরে পেমেন্ট / সেন্ড মানি করুন।
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 3: Nagad Direct */}
                  {settings.manual_nagad_enabled !== false && (
                    <div
                      onClick={() => setPaymentMethod('manual_nagad')}
                      className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'manual_nagad'
                          ? 'border-[#f7941d] bg-orange-50/60 ring-2 ring-[#f7941d]/20 shadow-xs'
                          : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            paymentMethod === 'manual_nagad'
                              ? 'border-[#f7941d] bg-[#f7941d]'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {paymentMethod === 'manual_nagad' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-extrabold text-xs sm:text-sm text-zinc-900 flex items-center gap-1.5">
                              <span>নগদ (Nagad)</span>
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#f7941d] text-white shrink-0">
                              Nagad
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-tight">
                            সরাসরি নগদ নম্বরে পেমেন্ট / সেন্ড মানি করুন।
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 4: Bank Transfer / Card */}
                  {settings.manual_bank_enabled !== false && (
                    <div
                      onClick={() => setPaymentMethod('manual_bank')}
                      className={`relative p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'manual_bank'
                          ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/20 shadow-xs'
                          : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            paymentMethod === 'manual_bank'
                              ? 'border-slate-900 bg-slate-900'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {paymentMethod === 'manual_bank' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-extrabold text-xs sm:text-sm text-zinc-900 flex items-center gap-1.5">
                              <span>ব্যাংক / কার্ড (Bank)</span>
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-white shrink-0">
                              Bank/Card
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-tight">
                            ব্যাংক অ্যাকাউন্ট ডিপোজিট বা কার্ড ফান্ড ট্রান্সফার।
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 5: Online Payment Gateway (API) */}
                  <div
                    onClick={() => {
                      if (!onlinePaymentEnabled) {
                        return;
                      }
                      setPaymentMethod('online');
                    }}
                    className={`relative p-3 rounded-2xl border-2 transition-all ${
                      !onlinePaymentEnabled
                        ? 'border-zinc-200 bg-zinc-100/60 opacity-70 cursor-not-allowed sm:col-span-2'
                        : paymentMethod === 'online'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs cursor-pointer sm:col-span-2'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 cursor-pointer sm:col-span-2'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          !onlinePaymentEnabled
                            ? 'border-zinc-300 bg-zinc-200'
                            : paymentMethod === 'online'
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {onlinePaymentEnabled && paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-extrabold text-xs sm:text-sm text-zinc-900">
                            অনলাইন পেমেন্ট গেটওয়ে (UddoktaPay)
                          </span>
                          {!onlinePaymentEnabled ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-600 shrink-0">
                              অফলাইন
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 shrink-0 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              ইনস্ট্যান্ট
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-tight">
                          {!onlinePaymentEnabled
                            ? 'অনলাইন পেমেন্ট গেটওয়ে বর্তমানে অফলাইনে রাখা আছে। সরাসরি বিকাশ, নগদ, ব্যাংক বা ক্যাশ অন ডেলিভারিতে অর্ডার করুন।'
                            : 'বিকাশ, নগদ, রকেট, উপায় বা কার্ড দিয়ে স্বয়ংক্রিয় অনলাইন পেমেন্ট করুন।'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* DEDICATED DIRECT PAYMENT DETAILS & ACCOUNT NUMBERS BOXES   */}
                {/* ========================================================= */}

                {/* 1. bKash Direct Details Card */}
                {paymentMethod === 'manual_bkash' && (
                  <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#e2136e]/40 bg-gradient-to-br from-pink-50/70 via-white to-pink-50/40 space-y-3.5 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-pink-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-[#e2136e] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                          bK
                        </span>
                        <div>
                          <h5 className="font-black text-sm text-zinc-900 flex items-center gap-1.5">
                            <span>বিকাশ সরাসরি পেমেন্ট</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#e2136e]">
                              {settings.manual_bkash_type || 'Personal'} Account
                            </span>
                          </h5>
                          <span className="text-[11px] text-zinc-500">
                            {settings.manual_bkash_type === 'Merchant' ? 'পেমেন্ট করুন' : settings.manual_bkash_type === 'Agent' ? 'ক্যাশ আউট করুন' : 'Send Money করুন'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-zinc-500 block">পরিশোধযোগ্য টাকা:</span>
                        <span className="text-base font-black text-[#e2136e]">
                          ৳{grandTotal.toLocaleString('en-BD')}
                        </span>
                      </div>
                    </div>

                    {/* Copyable Account Box */}
                    <div className="bg-white p-3 rounded-xl border border-pink-200 flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                          বিকাশ নম্বর ({settings.manual_bkash_type || 'Personal'}):
                        </span>
                        <span className="text-base sm:text-lg font-black font-mono text-zinc-900 tracking-wider">
                          {settings.manual_bkash_number || '01844932809'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(settings.manual_bkash_number || '01844932809', 'bkash')}
                        className="px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#e2136e] border border-pink-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedAccount === 'bkash' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-black">কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>নম্বর কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="text-xs text-zinc-700 bg-pink-100/40 p-3 rounded-xl border border-pink-200/80 space-y-1 leading-relaxed">
                      <div className="font-bold text-[#e2136e] flex items-center gap-1">
                        <span>💡 পেমেন্ট করার নিয়মাবলী:</span>
                      </div>
                      <p>
                        {settings.manual_bkash_instructions || `১. আপনার বিকাশ অ্যাপ থেকে ${settings.manual_bkash_type === 'Merchant' ? 'Make Payment' : settings.manual_bkash_type === 'Agent' ? 'Cash Out' : 'Send Money'} অপশনে গিয়ে উপরের নম্বরে মোট ৳${grandTotal.toLocaleString('en-BD')} টাকা পাঠান।`}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        ২. সফলভাবে টাকা পাঠানোর পর প্রাপ্ত TrxID এবং যে বিকাশ নম্বর থেকে পাঠিয়েছেন তা নিচের বক্সে দিন।
                      </p>
                    </div>

                    {/* Inputs for Sender Phone & TrxID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          আপনার বিকাশ নম্বর (Sender Number)
                        </label>
                        <input
                          type="tel"
                          value={manualSenderNumber}
                          onChange={(e) => setManualSenderNumber(e.target.value)}
                          placeholder="e.g. 017XXXXXXXX"
                          className="w-full bg-white text-zinc-900 text-xs sm:text-sm p-2.5 rounded-xl border border-zinc-300 focus:border-[#e2136e] focus:outline-none font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualTrxId}
                          onChange={(e) => setManualTrxId(e.target.value.toUpperCase())}
                          placeholder="e.g. BL92KJ78X"
                          className="w-full bg-white text-zinc-900 text-xs sm:text-sm p-2.5 rounded-xl border border-zinc-300 focus:border-[#e2136e] focus:outline-none font-mono uppercase font-bold tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Nagad Direct Details Card */}
                {paymentMethod === 'manual_nagad' && (
                  <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#f7941d]/40 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40 space-y-3.5 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-orange-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-[#f7941d] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                          ন
                        </span>
                        <div>
                          <h5 className="font-black text-sm text-zinc-900 flex items-center gap-1.5">
                            <span>নগদ সরাসরি পেমেন্ট</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#f7941d]">
                              {settings.manual_nagad_type || 'Personal'} Account
                            </span>
                          </h5>
                          <span className="text-[11px] text-zinc-500">
                            {settings.manual_nagad_type === 'Merchant' ? 'Payment করুন' : 'Send Money করুন'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-zinc-500 block">পরিশোধযোগ্য টাকা:</span>
                        <span className="text-base font-black text-[#f7941d]">
                          ৳{grandTotal.toLocaleString('en-BD')}
                        </span>
                      </div>
                    </div>

                    {/* Copyable Account Box */}
                    <div className="bg-white p-3 rounded-xl border border-orange-200 flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                          নগদ নম্বর ({settings.manual_nagad_type || 'Personal'}):
                        </span>
                        <span className="text-base sm:text-lg font-black font-mono text-zinc-900 tracking-wider">
                          {settings.manual_nagad_number || '01844932809'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(settings.manual_nagad_number || '01844932809', 'nagad')}
                        className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#f7941d] border border-orange-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedAccount === 'nagad' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-black">কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>নম্বর কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="text-xs text-zinc-700 bg-orange-100/40 p-3 rounded-xl border border-orange-200/80 space-y-1 leading-relaxed">
                      <div className="font-bold text-[#f7941d] flex items-center gap-1">
                        <span>💡 পেমেন্ট করার নিয়মাবলী:</span>
                      </div>
                      <p>
                        {settings.manual_nagad_instructions || `১. আপনার নগদ অ্যাপ থেকে ${settings.manual_nagad_type === 'Merchant' ? 'Payment' : 'Send Money'} অপশনে গিয়ে উপরের নম্বরে মোট ৳${grandTotal.toLocaleString('en-BD')} টাকা পাঠান।`}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        ২. টাকা পাঠানো সম্পন্ন হলে SMS বা অ্যাপ থেকে TrxID এবং আপনার নগদ নম্বর নিচে লিখুন।
                      </p>
                    </div>

                    {/* Inputs for Sender Phone & TrxID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          আপনার নগদ নম্বর (Sender Number)
                        </label>
                        <input
                          type="tel"
                          value={manualSenderNumber}
                          onChange={(e) => setManualSenderNumber(e.target.value)}
                          placeholder="e.g. 017XXXXXXXX"
                          className="w-full bg-white text-zinc-900 text-xs sm:text-sm p-2.5 rounded-xl border border-zinc-300 focus:border-[#f7941d] focus:outline-none font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualTrxId}
                          onChange={(e) => setManualTrxId(e.target.value.toUpperCase())}
                          placeholder="e.g. 7GJ910KL"
                          className="w-full bg-white text-zinc-900 text-xs sm:text-sm p-2.5 rounded-xl border border-zinc-300 focus:border-[#f7941d] focus:outline-none font-mono uppercase font-bold tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Bank Transfer / Card Direct Details Card */}
                {paymentMethod === 'manual_bank' && (
                  <div className="p-4 sm:p-5 rounded-2xl border-2 border-slate-700/30 bg-gradient-to-br from-slate-50 via-white to-zinc-100/60 space-y-3.5 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                          <Landmark className="w-4 h-4 text-emerald-400" />
                        </span>
                        <div>
                          <h5 className="font-black text-sm text-zinc-900 flex items-center gap-1.5">
                            <span>ব্যাংক অ্যাকাউন্ট / কার্ড ট্রান্সফার</span>
                          </h5>
                          <span className="text-[11px] text-zinc-500">
                            {settings.manual_bank_name || 'The City Bank Ltd.'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-zinc-500 block">পরিশোধযোগ্য টাকা:</span>
                        <span className="text-base font-black text-slate-900">
                          ৳{grandTotal.toLocaleString('en-BD')}
                        </span>
                      </div>
                    </div>

                    {/* Bank Account Details Grid */}
                    <div className="bg-white p-3.5 rounded-xl border border-zinc-200 space-y-2 text-xs shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">ব্যাংকের নাম:</span>
                          <span className="font-black text-zinc-900">{settings.manual_bank_name || 'The City Bank Ltd.'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">অ্যাকাউন্ট নাম:</span>
                          <span className="font-black text-zinc-900">{settings.manual_bank_account_name || 'Maxora Bangladesh'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-zinc-400 block">অ্যাকাউন্ট নম্বর:</span>
                          <span className="text-base font-black font-mono text-zinc-900 tracking-wider">
                            {settings.manual_bank_account_number || '1102938475001'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyAccount(settings.manual_bank_account_number || '1102938475001', 'bank')}
                          className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {copiedAccount === 'bank' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-black">কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>নম্বর কপি করুন</span>
                            </>
                          )}
                        </button>
                      </div>

                      {(settings.manual_bank_branch || settings.manual_bank_routing) && (
                        <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
                          {settings.manual_bank_branch && <span>শাখা: <strong>{settings.manual_bank_branch}</strong> </span>}
                          {settings.manual_bank_routing && <span>• রাউটিং: <strong>{settings.manual_bank_routing}</strong></span>}
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <p className="text-xs text-zinc-600 bg-zinc-100/80 p-2.5 rounded-xl border border-zinc-200 leading-relaxed">
                      💡 {settings.manual_bank_instructions || `উপরের ব্যাংক অ্যাকাউন্টে মোট ৳${grandTotal.toLocaleString('en-BD')} টাকা জমা বা ট্রান্সফার করে ডিপোজিট স্লিপ নম্বর বা ট্রানজেকশন রেফারেন্স নিচে প্রদান করুন।`}
                    </p>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          প্রেরক অ্যাকাউন্ট / ব্যাংক / কার্ডের তথ্য
                        </label>
                        <input
                          type="text"
                          value={manualSenderNumber}
                          onChange={(e) => setManualSenderNumber(e.target.value)}
                          placeholder="e.g. City Bank / Brac Bank"
                          className="w-full bg-white text-zinc-900 text-xs sm:text-sm p-2.5 rounded-xl border border-zinc-300 focus:border-slate-800 focus:outline-none font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          ডিপোজিট স্লিপ / TrxID / রেফারেন্স <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualTrxId}
                          onChange={(e) => setManualTrxId(e.target.value.toUpperCase())}
                          placeholder="e.g. DEP-98231 / TX123"
                          className="w-full bg-white text-zinc-900 text-xs sm:text-sm p-2.5 rounded-xl border border-zinc-300 focus:border-slate-800 focus:outline-none font-mono uppercase font-bold tracking-wider"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                  {isFreeShipping ? (
                    <span className="font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 text-xs">
                      ৳0 (FREE DELIVERY)
                    </span>
                  ) : (
                    <span className="font-semibold text-white">৳{deliveryCharge.toLocaleString('en-BD')}</span>
                  )}
                </div>
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-base font-black">
                  <span>
                    {paymentMethod === 'online'
                      ? 'Grand Total (Pay Online)'
                      : paymentMethod === 'manual_bkash'
                      ? 'Grand Total (Pay via bKash)'
                      : paymentMethod === 'manual_nagad'
                      ? 'Grand Total (Pay via Nagad)'
                      : paymentMethod === 'manual_bank'
                      ? 'Grand Total (Pay via Bank)'
                      : 'Grand Total (Pay on Delivery)'}
                  </span>
                  <span className="text-emerald-400 text-xl">
                    ৳{grandTotal.toLocaleString('en-BD')}
                  </span>
                </div>

                <div className="bg-zinc-800/80 p-2.5 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  {paymentMethod === 'online' ? (
                    <span>
                      Payment Gateway: <strong>UddoktaPay</strong> (bKash, Nagad, Rocket, Cards - SSL Secured)
                    </span>
                  ) : paymentMethod === 'manual_bkash' ? (
                    <span>
                      Payment Method: <strong>বিকাশ সরাসরি পেমেন্ট (নম্বর: {settings.manual_bkash_number || '01844932809'})</strong>
                    </span>
                  ) : paymentMethod === 'manual_nagad' ? (
                    <span>
                      Payment Method: <strong>নগদ সরাসরি পেমেন্ট (নম্বর: {settings.manual_nagad_number || '01844932809'})</strong>
                    </span>
                  ) : paymentMethod === 'manual_bank' ? (
                    <span>
                      Payment Method: <strong>ব্যাংক ডিপোজিট / কার্ড ট্রান্সফার ({settings.manual_bank_name || 'The City Bank Ltd.'})</strong>
                    </span>
                  ) : (
                    <span>
                      Payment Method: <strong>Cash on Delivery (No advance required)</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{paymentMethod === 'online' ? 'Connecting to Payment Gateway...' : 'Placing Your Order...'}</span>
                ) : paymentMethod === 'online' ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Online with bKash/Nagad/Rocket (৳{grandTotal.toLocaleString('en-BD')})</span>
                  </>
                ) : paymentMethod === 'manual_bkash' ? (
                  <>
                    <span className="w-4 h-4 rounded-full bg-[#e2136e] text-white flex items-center justify-center text-[10px] font-black">bK</span>
                    <span>Confirm Order with bKash (৳{grandTotal.toLocaleString('en-BD')})</span>
                  </>
                ) : paymentMethod === 'manual_nagad' ? (
                  <>
                    <span className="w-4 h-4 rounded-full bg-[#f7941d] text-white flex items-center justify-center text-[10px] font-black">ন</span>
                    <span>Confirm Order with Nagad (৳{grandTotal.toLocaleString('en-BD')})</span>
                  </>
                ) : paymentMethod === 'manual_bank' ? (
                  <>
                    <Landmark className="w-4 h-4 text-zinc-950" />
                    <span>Confirm Order with Bank Transfer (৳{grandTotal.toLocaleString('en-BD')})</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Order (Cash on Delivery - ৳{grandTotal.toLocaleString('en-BD')})</span>
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
