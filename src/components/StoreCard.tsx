import React from 'react';
import { Store, MapPin, Clock, Phone, ArrowLeft, Tag } from 'lucide-react';
import { Store as StoreType } from '../types';

interface StoreCardProps {
  store: StoreType;
  onClick: () => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-md hover:border-emerald-200"
    >
      {/* Banner */}
      <div className="relative h-32 w-full overflow-hidden bg-slate-100">
        <img
          src={store.banner}
          alt={store.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Category tag */}
        <div className="absolute top-3 right-3 rounded-xl bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 backdrop-blur-xs shadow-2xs">
          {store.category}
        </div>
      </div>

      {/* Content */}
      <div className="relative p-4 pt-2">
        {/* Logo floating */}
        <div className="-mt-10 mb-2 flex items-end justify-between">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md">
            <img
              src={store.logo}
              alt={store.name}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>متجر نشط</span>
          </span>
        </div>

        {/* Store Name & Description */}
        <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
          {store.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {store.description}
        </p>

        {/* Meta Info */}
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{store.address}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{store.workingHours}</span>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-3 flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-[-2px] transition flex items-center gap-1">
            <span>زيارة المتجر والطلب</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
