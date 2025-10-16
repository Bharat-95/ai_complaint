"use client";

import React from "react";
import { MessageCircle, Mic } from 'lucide-react';
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-black">
   
      <div className="w-full max-w-2xl bg-white/95 rounded-3xl shadow-2xl p-8 sm:p-12 relative">
   
        

  
        <h1 className="text-2xl font-extrabold text-teal-700 text-center mb-1">Rental Housing Tribunal</h1>
        <p className="text-center text-slate-400 uppercase tracking-wide text-sm mb-3">Complaints Registration Assistant</p>

     
        <div className="max-w-2xl mx-auto">
          <label htmlFor="assist" className="sr-only">Choose assistant</label>
          <div className="relative">
            <select
              id="assist"
              defaultValue="complaint"
              className="w-full appearance-none bg-white rounded-xl py-2 px-5 pr-12 text-lg shadow-sm focus:outline-none"
            >
              <option value="complaint">Complaint Registration Assistant</option>
             
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>


          <div className="mt-6 flex gap-4 justify-center">
            <Link 
              href='/chat-assistance'
              className="flex items-center gap-3 bg-gradient-to-tr from-teal-600 to-teal-500 text-white px-6 py-3 rounded-xl shadow-md hover:scale-[1.01] transition-transform"
            >
              <span className="inline-flex items-center justify-center w-7 h-7 bg-white/20 rounded-full">
                <MessageCircle/>
              </span>
              <span className="font-semibold">Start Assistance</span>
            </Link>

            <Link
            href='/voice-assistance'
              className="flex items-center gap-3 bg-gradient-to-tr from-teal-500 to-teal-400 text-white px-6 py-3 rounded-xl shadow-md hover:scale-[1.01] transition-transform"
            >
             <Mic/>
              <span className="font-semibold">Voice Assistant</span>
            </Link>
          </div>

  
          <div className="mt-8 bg-sky-50 border border-sky-100 rounded-xl p-5 shadow-inner">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-extrabold text-teal-700">FREE</div>
                <div className="text-sm text-slate-400">Service</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-teal-700">24/7</div>
                <div className="text-sm text-slate-400">Available</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-teal-700">3M</div>
                <div className="text-sm text-slate-400">Max Processing</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-40 h-40 rounded-full bg-white/60 blur-3xl opacity-30" />
      </div>
    </div>
  );
}
