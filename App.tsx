import React, { useMemo, useState } from 'react';
import {
  UserPlus,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  BrainCircuit,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import DoctorCard from './components/DoctorCard';
import { BASE_DOCTORS_DATA, RANK_LEVELS, TREATMENTS } from './constants';
import type { DoctorWithDailyStats, RequiredRank, Treatment, MatchError } from './types';
import { getAiRecommendation } from './api/secure-jsonbin';

export default function App() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [matchedDoctor, setMatchedDoctor] = useState<DoctorWithDailyStats | MatchError | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [aiReason, setAiReason] = useState('');

  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [viewRange, setViewRange] = useState({ start: appointmentDate, end: appointmentDate });

  // 模擬每日看診統計
  const doctorsWithDailyStats: DoctorWithDailyStats[] = useMemo(() => {
    return BASE_DOCTORS_DATA.map((doc) => {
      const dateSeed = appointmentDate
        .split('-')
        .reduce((acc, part) => acc + parseInt(part, 10), 0);
      const dailyCount = (doc.id + dateSeed) % 6;
      return { ...doc, dailyCount };
    });
  }, [appointmentDate]);

  const selectedTreatments: Treatment[] = useMemo(
    () => TREATMENTS.filter((t) => selectedIds.includes(t.id)),
    [selectedIds]
  );

  const requiredRank: RequiredRank | null = useMemo(() => {
    if (selectedTreatments.length === 0) return null;

    let maxLevel = 0;
    let maxRankName: RequiredRank['name'] = 'Intern';

    selectedTreatments.forEach((t) => {
      if (RANK_LEVELS[t.minRank] > maxLevel) {
        maxLevel = RANK_LEVELS[t.minRank];
        maxRankName = t.minRank;
      }
    });

    return { name: maxRankName, level: maxLevel };
  }, [selectedTreatments]);

  const handleMatch = async () => {
    if (selectedTreatments.length === 0 || !requiredRank) return;

    setIsMatching(true);
    setMatchedDoctor(null);

    const scoringList: DoctorWithDailyStats[] = doctorsWithDailyStats.map((doc) => {
      const rankOk = RANK_LEVELS[doc.rank] >= requiredRank.level;
      const dailyOk = doc.dailyCount < 5;
      const deptOk = selectedTreatments.map((t) => t.dept).some((d) => doc.dept.includes(d));

      if (!rankOk || !dailyOk || !deptOk) return { ...doc, totalScore: -1 };

      let urgency = 0;
      selectedTreatments.forEach((t) => {
        const target = doc.targets[t.name] || 1;
        urgency += ((target - (doc.currentCases[t.name] || 0)) / target) * 100;
      });

      const urgencyScore = urgency / selectedTreatments.length;
      const loadScore = ((150 - doc.monthlyTotal) / 150) * 100;

      return {
        ...doc,
        urgencyScore,
        loadScore,
        totalScore: urgencyScore * 0.7 + loadScore * 0.3,
      };
    });

    const eligible = scoringList.filter((d) => (d.totalScore ?? -1) >= 0);

    if (eligible.length === 0) {
      setMatchedDoctor({ error: '查無符合職等或該日未滿額之醫師' });
      setIsMatching(false);
      return;
    }

    const winner = eligible.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))[0];

    const reason = await getAiRecommendation({
      doctor: winner,
      patientName: patientName || '未具名病患',
      treatments: selectedTreatments,
      date: appointmentDate,
    });

    setMatchedDoctor(winner);
    setAiReason(reason);
    setIsMatching(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Top */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-2xl text-white">
                <BrainCircuit size={28} />
              </div>
              牙科智慧配對系統
            </h1>
            <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">
              Deployment Ready v3.5
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">
                統計區間
              </label>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <input
                  type="date"
                  className="bg-transparent border-none text-xs font-bold px-2 py-1 outline-none"
                  value={viewRange.start}
                  onChange={(e) => setViewRange({ ...viewRange, start: e.target.value })}
                />
                <span className="text-slate-400 mx-1">-</span>
                <input
                  type="date"
                  className="bg-transparent border-none text-xs font-bold px-2 py-1 outline-none"
                  value={viewRange.end}
                  onChange={(e) => setViewRange({ ...viewRange, end: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-3">
              <CalendarDays className="text-indigo-600" size={20} />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">排程日期</span>
                <span className="text-sm font-black text-indigo-700">{appointmentDate}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                <UserPlus size={22} className="text-indigo-600" /> 新增約診
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block tracking-wider">
                    預約日期
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                    value={appointmentDate}
                    onChange={(e) => {
                      setAppointmentDate(e.target.value);
                      setMatchedDoctor(null);
                    }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block tracking-wider">
                    病患姓名
                  </label>
                  <input
                    type="text"
                    placeholder="輸入姓名..."
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block tracking-wider">
                    處置項目
                  </label>

                  <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    {TREATMENTS.map((t) => {
                      const active = selectedIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedIds((prev) =>
                              prev.includes(t.id) ? prev.filter((i) => i !== t.id) : [...prev, t.id]
                            );
                            setMatchedDoctor(null);
                          }}
                          className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                            active
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-slate-100 hover:border-indigo-200'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
                              active ? 'bg-white text-indigo-600' : 'bg-slate-50'
                            }`}
                          >
                            {active && <CheckCircle size={14} />}
                          </div>

                          <div className="flex-1">
                            <div className="text-sm font-bold">{t.name}</div>
                            <div className={`text-[10px] ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {t.dept} · {t.minRank}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleMatch}
                  disabled={selectedIds.length === 0 || isMatching}
                  className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {isMatching ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                  執行 AI 配對
                </button>
              </div>
            </section>

            {/* Result */}
            {matchedDoctor && (
              <div className="animate-in slide-in-from-bottom-8 duration-500">
                {'error' in matchedDoctor ? (
                  <div className="bg-rose-50 border-2 border-rose-100 p-5 rounded-3xl flex gap-4 text-rose-700 items-center">
                    <AlertCircle />
                    <span className="text-sm font-bold">{matchedDoctor.error}</span>
                  </div>
                ) : (
                  <div className="bg-indigo-600 p-6 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-indigo-200">
                            最佳建議日期: {appointmentDate}
                          </span>
                          <h3 className="text-3xl font-black mt-1">{matchedDoctor.name} 醫師</h3>
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-xl text-xs font-bold">
                          {Math.round(matchedDoctor.totalScore ?? 0)} 分
                        </div>
                      </div>

                      <p className="text-sm text-indigo-100 bg-white/10 p-4 rounded-2xl italic leading-relaxed">
                        “{aiReason}”
                      </p>

                      <button className="w-full mt-6 bg-white text-indigo-600 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all">
                        確認預約
                      </button>
                    </div>

                    <BrainCircuit className="absolute -right-8 -bottom-8 text-white/10" size={140} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="lg:col-span-8">
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Stethoscope size={28} className="text-indigo-600" /> 醫師負載監控
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    選定日: <span className="font-bold text-slate-600">{appointmentDate}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl">
                  <button className="p-2 hover:bg-white rounded-lg transition-all">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold px-2">快速切換</span>
                  <button className="p-2 hover:bg-white rounded-lg transition-all">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctorsWithDailyStats.map((doc) => (
                  <DoctorCard key={doc.id} doc={doc} requiredRank={requiredRank} isFull={doc.dailyCount >= 5} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        `,
        }}
      />
    </div>
  );
}
