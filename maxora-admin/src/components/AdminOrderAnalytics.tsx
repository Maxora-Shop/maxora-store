import React from 'react';
import {
  ShoppingBag,
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface AdminOrderAnalyticsProps {
  orders: Order[];
  onFilterByStatus: (status: string) => void;
  activeStatusFilter?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AdminOrderAnalytics: React.FC<AdminOrderAnalyticsProps> = ({
  orders,
  onFilterByStatus,
  activeStatusFilter = '',
  onRefresh,
  isLoading = false,
}) => {
  const totalOrders = orders.length;

  // Status Counts
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const processingCount = orders.filter(
    (o) => o.status === 'Processing' || o.status === 'Confirmed'
  ).length;
  const shippedCount = orders.filter((o) => o.status === 'Shipped').length;
  const deliveredCount = orders.filter(
    (o) => o.status === 'Delivered' || o.status === 'Completed'
  ).length;
  const cancelledCount = orders.filter(
    (o) => o.status === 'Cancelled' || o.status === 'Returned'
  ).length;

  // Pipeline aggregate
  const activePipelineCount = pendingCount + processingCount + shippedCount;

  // Dynamic percentage calculation helper: formula: (count / total) * 100
  const getPercentage = (count: number): number => {
    if (totalOrders === 0) return 0;
    return (count / totalOrders) * 100;
  };

  const formatPercentage = (count: number): string => {
    const pct = getPercentage(count);
    return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
  };

  // Financial calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const deliveredRevenue = orders
    .filter((o) => o.status === 'Delivered' || o.status === 'Completed')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pipelineRevenue = orders
    .filter((o) => ['Pending', 'Confirmed', 'Processing', 'Shipped'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const cancelledRevenue = orders
    .filter((o) => ['Cancelled', 'Returned'].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const cards = [
    {
      id: '',
      title: 'Total Orders',
      count: totalOrders,
      percentage: '100%',
      icon: ShoppingBag,
      color: 'zinc',
      borderColor: 'border-zinc-200',
      activeBorder: 'border-zinc-950 ring-2 ring-zinc-950/20',
      bgColor: 'bg-white',
      badgeBg: 'bg-zinc-100 text-zinc-800',
      textColor: 'text-zinc-950',
      iconBg: 'bg-zinc-900 text-white',
      subText: `৳${totalRevenue.toLocaleString('en-BD')} Total Value`,
    },
    {
      id: 'Pending',
      title: 'Pending Orders',
      count: pendingCount,
      percentage: formatPercentage(pendingCount),
      icon: Clock,
      color: 'amber',
      borderColor: 'border-amber-200',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
      bgColor: 'bg-amber-50/50',
      badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
      textColor: 'text-amber-900',
      iconBg: 'bg-amber-500 text-zinc-950',
      subText: 'Awaiting Confirmation',
    },
    {
      id: 'Processing',
      title: 'Processing Orders',
      count: processingCount,
      percentage: formatPercentage(processingCount),
      icon: PackageCheck,
      color: 'blue',
      borderColor: 'border-blue-200',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
      bgColor: 'bg-blue-50/50',
      badgeBg: 'bg-blue-100 text-blue-900 border border-blue-300',
      textColor: 'text-blue-900',
      iconBg: 'bg-blue-600 text-white',
      subText: 'Packaging & Warehouse',
    },
    {
      id: 'Shipped',
      title: 'Shipped Orders',
      count: shippedCount,
      percentage: formatPercentage(shippedCount),
      icon: Truck,
      color: 'indigo',
      borderColor: 'border-indigo-200',
      activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/20',
      bgColor: 'bg-indigo-50/50',
      badgeBg: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
      textColor: 'text-indigo-900',
      iconBg: 'bg-indigo-600 text-white',
      subText: 'With Courier / On the Way',
    },
    {
      id: 'Delivered',
      title: 'Delivered / Completed',
      count: deliveredCount,
      percentage: formatPercentage(deliveredCount),
      icon: CheckCircle2,
      color: 'emerald',
      borderColor: 'border-emerald-200',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
      bgColor: 'bg-emerald-50/50',
      badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      textColor: 'text-emerald-950',
      iconBg: 'bg-emerald-600 text-white',
      subText: `৳${deliveredRevenue.toLocaleString('en-BD')} Collected`,
    },
    {
      id: 'Cancelled',
      title: 'Cancelled Orders',
      count: cancelledCount,
      percentage: formatPercentage(cancelledCount),
      icon: XCircle,
      color: 'rose',
      borderColor: 'border-rose-200',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
      bgColor: 'bg-rose-50/50',
      badgeBg: 'bg-rose-100 text-rose-900 border border-rose-300',
      textColor: 'text-rose-950',
      iconBg: 'bg-rose-600 text-white',
      subText: `৳${cancelledRevenue.toLocaleString('en-BD')} Cancelled`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                <span>Order Status Analytics & Metrics</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Live Dynamic
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Dynamic analytics derived strictly from real Firestore order records ({totalOrders} orders)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeStatusFilter && (
            <button
              onClick={() => onFilterByStatus('')}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Clear Filter ({activeStatusFilter})</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 6 Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => {
          const isSelected = activeStatusFilter === card.id;
          const Icon = card.icon;

          return (
            <button
              key={card.title}
              type="button"
              onClick={() => onFilterByStatus(isSelected ? '' : card.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                isSelected
                  ? card.activeBorder + ' shadow-md scale-[1.02]'
                  : `${card.borderColor} ${card.bgColor} hover:shadow-xs hover:border-zinc-400`
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${card.badgeBg}`}>
                  {card.percentage}
                </span>
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-bold text-zinc-500 block leading-tight">
                  {card.title}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-zinc-950 font-mono">
                    {card.count}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">orders</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-semibold truncate mt-1">
                  {card.subText}
                </div>
              </div>

              {/* Selection indicator pill */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Visual Order Funnel / Order Progress Section */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Order Progress & Customer Journey Funnel</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Visual pipeline tracking order progression from customer placement to fulfillment and delivery
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-zinc-100 text-zinc-700 self-start sm:self-auto">
            Order Status Distribution
          </span>
        </div>

        {/* Funnel Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {/* Step 1: Placed */}
          <div
            onClick={() => onFilterByStatus('')}
            className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100/80 transition-all cursor-pointer relative group"
          >
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Step 1</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
                100%
              </span>
            </div>
            <div className="text-sm font-black text-zinc-900">Total Orders Placed</div>
            <div className="text-2xl font-black font-mono text-zinc-950 mt-1">
              {totalOrders} <span className="text-xs font-normal text-zinc-500">orders</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-2">
              Base volume of all customer orders in Firestore
            </div>
            <div className="mt-3 w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-zinc-900 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Step 2: Active Pipeline */}
          <div
            onClick={() => onFilterByStatus('Pending')}
            className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-100/50 transition-all cursor-pointer relative group"
          >
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Step 2</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                {formatPercentage(activePipelineCount)}
              </span>
            </div>
            <div className="text-sm font-black text-amber-950">Active Orders Pipeline</div>
            <div className="text-2xl font-black font-mono text-amber-950 mt-1">
              {activePipelineCount} <span className="text-xs font-normal text-amber-700">orders</span>
            </div>
            <div className="text-[11px] text-amber-700 mt-2">
              Pending confirmation ({pendingCount}) + fulfillment ({processingCount + shippedCount})
            </div>
            <div className="mt-3 w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(activePipelineCount)}%` }}
              ></div>
            </div>
          </div>

          {/* Step 3: Fulfillment (Processing & Shipped) */}
          <div
            onClick={() => onFilterByStatus('Processing')}
            className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 hover:bg-blue-100/50 transition-all cursor-pointer relative group"
          >
            <div className="flex items-center justify-between text-blue-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Step 3</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                {formatPercentage(processingCount + shippedCount)}
              </span>
            </div>
            <div className="text-sm font-black text-blue-950">Processing & Shipped</div>
            <div className="text-2xl font-black font-mono text-blue-950 mt-1">
              {processingCount + shippedCount} <span className="text-xs font-normal text-blue-700">orders</span>
            </div>
            <div className="text-[11px] text-blue-700 mt-2">
              Packaging ({processingCount}) + In transit ({shippedCount})
            </div>
            <div className="mt-3 w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(processingCount + shippedCount)}%` }}
              ></div>
            </div>
          </div>

          {/* Step 4: Successfully Delivered */}
          <div
            onClick={() => onFilterByStatus('Delivered')}
            className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/50 transition-all cursor-pointer relative group"
          >
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Step 4 (Final)</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                {formatPercentage(deliveredCount)}
              </span>
            </div>
            <div className="text-sm font-black text-emerald-950">Delivered / Completed</div>
            <div className="text-2xl font-black font-mono text-emerald-950 mt-1">
              {deliveredCount} <span className="text-xs font-normal text-emerald-700">orders</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-2">
              Successfully received by customer & payment collected
            </div>
            <div className="mt-3 w-full bg-emerald-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(deliveredCount)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Status Distribution Horizontal Stacked Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-700">
              Complete Order Status Distribution Breakdown:
            </span>
            <span className="text-xs font-mono text-zinc-500">
              Total {totalOrders} orders
            </span>
          </div>

          <div className="w-full h-4 bg-zinc-100 rounded-full overflow-hidden flex shadow-inner">
            {totalOrders > 0 ? (
              <>
                {pendingCount > 0 && (
                  <div
                    title={`Pending: ${pendingCount} (${formatPercentage(pendingCount)})`}
                    style={{ width: `${getPercentage(pendingCount)}%` }}
                    className="bg-amber-400 hover:bg-amber-500 transition-all cursor-pointer"
                    onClick={() => onFilterByStatus('Pending')}
                  />
                )}
                {processingCount > 0 && (
                  <div
                    title={`Processing: ${processingCount} (${formatPercentage(processingCount)})`}
                    style={{ width: `${getPercentage(processingCount)}%` }}
                    className="bg-blue-500 hover:bg-blue-600 transition-all cursor-pointer"
                    onClick={() => onFilterByStatus('Processing')}
                  />
                )}
                {shippedCount > 0 && (
                  <div
                    title={`Shipped: ${shippedCount} (${formatPercentage(shippedCount)})`}
                    style={{ width: `${getPercentage(shippedCount)}%` }}
                    className="bg-indigo-500 hover:bg-indigo-600 transition-all cursor-pointer"
                    onClick={() => onFilterByStatus('Shipped')}
                  />
                )}
                {deliveredCount > 0 && (
                  <div
                    title={`Delivered: ${deliveredCount} (${formatPercentage(deliveredCount)})`}
                    style={{ width: `${getPercentage(deliveredCount)}%` }}
                    className="bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer"
                    onClick={() => onFilterByStatus('Delivered')}
                  />
                )}
                {cancelledCount > 0 && (
                  <div
                    title={`Cancelled: ${cancelledCount} (${formatPercentage(cancelledCount)})`}
                    style={{ width: `${getPercentage(cancelledCount)}%` }}
                    className="bg-rose-500 hover:bg-rose-600 transition-all cursor-pointer"
                    onClick={() => onFilterByStatus('Cancelled')}
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full bg-zinc-200" />
            )}
          </div>

          {/* Interactive Legend with counts and percentages */}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-zinc-100 text-xs font-semibold">
            <button
              onClick={() => onFilterByStatus('Pending')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="text-zinc-700">Pending:</span>
              <span className="font-mono text-zinc-950 font-bold">{pendingCount} ({formatPercentage(pendingCount)})</span>
            </button>

            <button
              onClick={() => onFilterByStatus('Processing')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-zinc-700">Processing:</span>
              <span className="font-mono text-zinc-950 font-bold">{processingCount} ({formatPercentage(processingCount)})</span>
            </button>

            <button
              onClick={() => onFilterByStatus('Shipped')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <span className="text-zinc-700">Shipped:</span>
              <span className="font-mono text-zinc-950 font-bold">{shippedCount} ({formatPercentage(shippedCount)})</span>
            </button>

            <button
              onClick={() => onFilterByStatus('Delivered')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-zinc-700">Delivered:</span>
              <span className="font-mono text-zinc-950 font-bold">{deliveredCount} ({formatPercentage(deliveredCount)})</span>
            </button>

            <button
              onClick={() => onFilterByStatus('Cancelled')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-zinc-700">Cancelled:</span>
              <span className="font-mono text-zinc-950 font-bold">{cancelledCount} ({formatPercentage(cancelledCount)})</span>
            </button>
          </div>
        </div>

        {/* Financial & Delivery summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
            <span className="text-xs font-bold text-zinc-500">Total Order Volume</span>
            <div className="text-lg font-black text-zinc-950 font-mono mt-0.5">
              ৳{totalRevenue.toLocaleString('en-BD')}
            </div>
            <span className="text-[11px] text-zinc-400 block mt-1">
              Avg. Order: ৳{avgOrderValue.toLocaleString('en-BD')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800">Completed Collections</span>
            <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
              ৳{deliveredRevenue.toLocaleString('en-BD')}
            </div>
            <span className="text-[11px] text-emerald-700 block mt-1">
              {formatPercentage(deliveredCount)} of total orders delivered
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
            <span className="text-xs font-bold text-amber-800">Pipeline In-Transit (COD)</span>
            <div className="text-lg font-black text-amber-950 font-mono mt-0.5">
              ৳{pipelineRevenue.toLocaleString('en-BD')}
            </div>
            <span className="text-[11px] text-amber-700 block mt-1">
              {activePipelineCount} active customer orders in progress
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
