import React from 'react';
import type { DoctorWithDailyStats, RequiredRank } from '../types';
import { RANK_LEVELS } from '../constants';

type Props = {
  doc: DoctorWithDailyStats;
  requiredRank: RequiredRank | null;
  isFull: boolean;
};

export default function DoctorCard({ doc, requiredRank, isFull }: Props) {
  const isLowRank = requiredRank ? RANK_LEVELS[doc.rank] < requiredRank.level : false;

  return (
    <div
      className={`p-6 rounded-[24px] border-2 transition-all relative ${
        isFull || isLowRank
          ? 'bg-slate-50 border-slate-100 opacity-60'
          : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-xl'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl ${
              doc.rank === 'VS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {doc.name[0]}
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-800">{doc.name} 醫師</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase">{doc.rank}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{doc.dept} 科</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-2xl font-black ${isFull ? 'text-rose-500' : 'text-indigo-600'}`}>
            {doc.dailyCount} / 5
          </div>
          <div className="text-[9px] text-slate-400 font-black uppercase">預約狀態</div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(doc.targets).map(([task, target]) => {
          const current = doc.currentCases[task] || 0;
          const perc = (current / target) * 100;

          return (
            <div key={task}>
              <div className="flex justify-between text-[10px] mb-1.5 font-black uppercase">
                <span className="text-slate-400">{task}</span>
                <span className={perc >= 100 ? 'text-green-600' : 'text-orange-600'}>
                  {current} / {target}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    perc >= 100 ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, perc)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {isFull && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-[24px] flex items-center justify-center">
          <div className="bg-rose-600 text-white text-[10px] px-3 py-1.5 rounded-xl font-black shadow-lg uppercase">
            已滿額
          </div>
        </div>
      )}

      {isLowRank && !isFull && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-[24px] flex items-center justify-center">
          <div className="bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-xl font-black shadow-lg uppercase">
            職等不符
          </div>
        </div>
      )}
    </div>
  );
}
