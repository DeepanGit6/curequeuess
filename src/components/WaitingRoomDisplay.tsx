import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Tv,
  Clock,
  Sparkles,
  Building2,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { Queue } from '../types.js';
import { playHospitalChime } from '../utils/audio.js';

interface WaitingRoomDisplayProps {
  queue: Queue | null;
}

export const WaitingRoomDisplay: React.FC<WaitingRoomDisplayProps> = ({ queue }) => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentlyServing = queue?.entries.find((e) => e.status === 'IN_PROGRESS');
  const nextInLine = queue?.entries.filter((e) => e.status === 'WAITING' || e.status === 'CALLED').slice(0, 4);

  return (
    <div className="min-h-[85vh] bg-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8 flex flex-col justify-between">
      {/* Top TV Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/30">
            CQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {queue?.hospitalName || 'Manipal Hospital, Salem'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {queue?.location || 'Salem, Tamil Nadu'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide mt-1">
              Public OPD Waiting Bay & Ambulatory Care • {queue?.hospitalAddress || 'Dalmia Board, Salem-Bangalore Highway, Salem'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Local Time</p>
            <p className="text-2xl font-black font-mono text-emerald-400">{currentTime}</p>
          </div>
          <button
            onClick={() => playHospitalChime()}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
            title="Chime Test"
          >
            <Volume2 className="w-5 h-5 text-blue-400" />
          </button>
        </div>
      </div>

      {/* Main Focus: NOW CALLING GIANT HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Active Token Calling (7 cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-blue-900/90 via-slate-900 to-slate-900 border-2 border-blue-500 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-4 py-1.5 rounded-full text-xs font-black bg-blue-500 text-white uppercase tracking-widest animate-pulse flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              Now Calling
            </span>
            <span className="text-sm font-mono text-blue-300">
              {queue?.doctor?.roomNumber || 'Room 3B'}
            </span>
          </div>

          <div className="space-y-2 text-center py-4">
            <p className="text-sm font-extrabold uppercase tracking-widest text-blue-300">
              Token Number
            </p>
            <div className="text-7xl sm:text-8xl font-black tracking-tighter text-white font-mono drop-shadow-md">
              {currentlyServing?.tokenNumber || 'A-024'}
            </div>
            <p className="text-2xl font-bold text-slate-200 mt-2">
              {currentlyServing?.patient?.user?.name || 'Vikram'}
            </p>
          </div>

          <div className="bg-slate-950/70 rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Please Proceed To</p>
              <p className="text-xl font-black text-emerald-400 mt-0.5">
                {queue?.doctor?.roomNumber || 'Consultation Room 3B'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Physician</p>
              <p className="text-base font-bold text-white mt-0.5">
                {queue?.doctor?.user?.name || 'Dr. Sarah Jenkins'}
              </p>
            </div>
          </div>
        </div>

        {/* Up Next Tokens (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Upcoming in Queue
            </h2>
            <span className="text-xs font-mono text-slate-500">Next to Call</span>
          </div>

          <div className="space-y-3">
            {nextInLine && nextInLine.length > 0 ? (
              nextInLine.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between transition hover:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-500 font-mono w-4">#{idx + 1}</span>
                    <span className="text-2xl font-black font-mono text-blue-400">{item.tokenNumber}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-200">
                      {item.patient?.user?.name?.split(' ')[0] || 'Patient'}
                    </p>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {item.triageCategory}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No additional patients in waiting queue.</p>
            )}
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-500">
              Please present your ticket barcode at the clinic door scanner upon call.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Live Ticker */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-slate-300">Hospital OPD Bulletin:</span>
          <span>Pharmacy window 2 is open for ticket holders. Wheelchair escorts available at Desk 1.</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-500">
          <span>Audio Chimes Synchronized</span>
        </div>
      </div>
    </div>
  );
};
