import React from 'react';

export const ChatIcon = ({ hasNotification }: { hasNotification: boolean }) => (
  <div className="relative">
    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center gap-0.5">
      <div className="w-1 h-1 rounded-full bg-white -mt-0.5" />
      <div className="w-1 h-1 rounded-full bg-white mt-0.5" />
    </div>
    {hasNotification && (
      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-white">
        <span className="text-white text-[10px] font-bold">1</span>
      </div>
    )}
  </div>
);

export const ClockIcon = () => (
  <div className="w-6 h-6 relative">
    <div className="w-6 h-6 rounded-full border-2 border-gray-700" />
    <div className="absolute top-1.5 left-[11px] w-0.5 h-1.5 bg-gray-700" />
    <div className="absolute top-[11px] left-1.5 w-1.5 h-0.5 bg-gray-700" />
  </div>
);

export const SquareIcon = () => (
  <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors">
    <span className="text-white text-sm font-bold">S</span>
  </div>
);

export const PointOfSaleIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center">
    <div className="w-10 h-8 rounded overflow-hidden flex flex-col">
      <div className="flex-1 bg-purple-500" />
      <div className="flex-1 bg-orange-500" />
      <div className="flex-1 bg-yellow-400" />
    </div>
  </div>
);

export const StockTakeIcon = () => (
  <div className="w-12 h-12 flex items-center justify-center">
    <div className="flex items-center justify-center h-8 gap-0.5">
      <div className="w-0.5 h-8 bg-black rounded-sm" />
      <div className="w-1 h-8 bg-black rounded-sm" />
      <div className="w-0.5 h-8 bg-black rounded-sm" />
      <div className="w-1.5 h-8 bg-black rounded-sm" />
      <div className="w-0.5 h-8 bg-black rounded-sm" />
      <div className="w-1 h-8 bg-black rounded-sm" />
      <div className="w-[3px] h-8 bg-black rounded-sm" />
      <div className="w-[5px] h-8 bg-black rounded-sm" />
      <div className="w-0.5 h-8 bg-black rounded-sm" />
      <div className="w-1 h-8 bg-black rounded-sm" />
    </div>
  </div>
);
