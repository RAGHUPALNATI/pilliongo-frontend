'use client';

import React from 'react';
import { Clock, CheckCircle2, Navigation, Flag } from 'lucide-react';
import Alert from './Alert';

const STAGES = [
  { key: 'REQUESTED', label: 'Requested', icon: Clock, desc: 'Waiting for driver' },
  { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2, desc: 'Driver matched' },
  { key: 'STARTED', label: 'Started', icon: Navigation, desc: 'On the way' },
  { key: 'COMPLETED', label: 'Completed', icon: Flag, desc: 'Destination reached' },
];

export default function StatusProgress({ status = 'REQUESTED' }) {
  if (status === 'CANCELLED') {
    return (
      <Alert variant="error" title="Ride Cancelled">
        This ride request has been cancelled.
      </Alert>
    );
  }

  const getStageIndex = (stageKey) => {
    switch (stageKey) {
      case 'REQUESTED': return 0;
      case 'ACCEPTED': return 1;
      case 'STARTED': return 2;
      case 'COMPLETED': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(status);

  return (
    <div className="w-full py-4">
      {/* Desktop Stepper Bar */}
      <div className="relative flex items-center justify-between">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-black/10 -translate-y-1/2 rounded-full z-0" />
        <div
          className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-[#F5720B] to-brand-orange -translate-y-1/2 rounded-full transition-all duration-500 z-0"
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {STAGES.map((step, index) => {
          const Icon = step.icon;
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCurrent
                    ? 'bg-gradient-to-br from-[#F5720B] to-brand-orange border-brand-orange text-white ring-4 ring-brand-orange/20 scale-110 shadow-glow-brand'
                    : isDone
                    ? 'bg-brand-navy border-brand-navy text-white'
                    : 'bg-white/70 backdrop-blur-sm border-black/10 text-ink-900/30'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-center mt-3">
                <p
                  className={`text-xs font-bold ${
                    isCurrent
                      ? 'text-brand-orange font-extrabold'
                      : isDone
                      ? 'text-brand-navy font-semibold'
                      : 'text-ink-900/35 font-medium'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-ink-900/40 hidden sm:block">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
