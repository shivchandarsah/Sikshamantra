import React from 'react';

// Individual skeleton components for different UI elements
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white border border-neutral-100 rounded-xl shadow-sm p-5 animate-pulse ${className}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
    </div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
);

export const SkeletonStatCard = ({ className = '' }) => (
  <div className={`flex flex-col items-center justify-center rounded-xl shadow bg-white p-6 border border-neutral-100 animate-pulse ${className}`}>
    <div className="mb-2 w-7 h-7 bg-gray-200 rounded"></div>
    <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
    <div className="w-20 h-4 bg-gray-200 rounded"></div>
  </div>
);

export const SkeletonChatMessage = ({ isOwn = false }) => (
  <div className={`flex ${isOwn ? 'justify-start' : 'justify-end'} mb-3`}>
    <div className={`max-w-[80%] p-3 rounded-2xl animate-pulse ${
      isOwn ? 'bg-gray-200' : 'bg-gray-100'
    }`}>
      <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
      <div className="h-3 bg-gray-300 rounded w-16"></div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 3, ItemComponent = SkeletonCard, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }, (_, i) => (
      <ItemComponent key={i} />
    ))}
  </div>
);

// Dashboard specific skeleton
export const DashboardSkeleton = () => (
  <div className="min-h-[90vh] w-full font-sans animate-pulse">
    {/* Header Skeleton */}
    <div className="mb-8 flex justify-between items-center">
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-5 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded w-24"></div>
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
      {[1, 2, 3].map((i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>

    {/* Section Header Skeleton */}
    <div className="flex items-center gap-2 mb-4">
      <div className="w-5 h-5 bg-gray-200 rounded"></div>
      <div className="w-32 h-5 bg-gray-200 rounded"></div>
    </div>

    {/* Content Grid Skeleton */}
    <div className="grid md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

// Chat skeleton
export const ChatSkeleton = () => (
  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
    <div className="text-center mb-4">
      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
    </div>
    {[1, 2, 3].map((i) => (
      <SkeletonChatMessage key={i} isOwn={i % 2 === 0} />
    ))}
  </div>
);

export default {
  Card: SkeletonCard,
  StatCard: SkeletonStatCard,
  ChatMessage: SkeletonChatMessage,
  List: SkeletonList,
  Dashboard: DashboardSkeleton,
  Chat: ChatSkeleton
};