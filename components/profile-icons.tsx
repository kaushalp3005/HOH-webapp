import React from 'react';

export const ArrowLeftIcon = ({ color = '#000000' }: { color?: string }) => (
  <div className="w-6 h-6 flex items-center justify-center">
    <div className="relative w-6 h-6 flex items-center">
      <div className="absolute left-1 w-3 h-0.5" style={{ backgroundColor: color }} />
      <div
        className="absolute left-0 top-[9px] w-0 h-0 border-r-[6px] border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent"
        style={{ borderRightColor: color }}
      />
    </div>
  </div>
);

export const ChatIconProfile = ({ notificationCount }: { notificationCount: number }) => (
  <div className="relative">
    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center gap-0.5">
      <div className="w-1 h-1 rounded-full bg-white -mt-0.5" />
      <div className="w-1 h-1 rounded-full bg-white mt-0.5" />
    </div>
    {notificationCount > 0 && (
      <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center border border-white">
        <span className="text-white text-[10px] font-bold">{notificationCount}</span>
      </div>
    )}
  </div>
);

export const ClockIconProfile = ({ color = '#CCCCCC' }: { color?: string }) => (
  <div className="w-6 h-6 relative">
    <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: color }} />
    <div className="absolute top-1.5 left-[11px] w-0.5 h-1.5" style={{ backgroundColor: color }} />
    <div className="absolute top-[11px] left-1.5 w-1.5 h-0.5" style={{ backgroundColor: color }} />
  </div>
);

export const SquareIconProfile = ({ size = 'small' }: { size?: 'small' | 'large' }) => (
  <div
    className={`rounded bg-orange-600 flex items-center justify-center ${
      size === 'large' ? 'w-16 h-16' : 'w-6 h-6'
    }`}
  >
    <span className={`text-white font-bold ${size === 'large' ? 'text-[32px]' : 'text-sm'}`}>
      S
    </span>
  </div>
);
