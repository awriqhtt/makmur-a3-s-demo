"use client";

import { useRef, useState, useEffect } from "react";
import { INDUSTRIES, getIndustryIcon, getIndustryImage } from "@/lib/data";

export default function IndustriesScroll() {
  return (
    <>
      {/* MOBILE — vertical fullscreen swipe, TikTok-style */}
      <div className="md:hidden -mx-5 mt-12">
        <div className="flex flex-col h-[70vh] overflow-y-auto snap-y snap-mandatory no-scrollbar rounded-2xl">
          {INDUSTRIES.map((ind) => {
            const Icon = getIndustryIcon(ind);
            return (
              <div
                key={ind}
                className="relative shrink-0 h-full w-full snap-start snap-always overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getIndustryImage(ind)}
                  alt={ind}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <div className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 text-ink" strokeWidth={1.5} />
                </div>
                <span className="absolute bottom-6 left-5 right-5 text-white font-semibold text-xl">
                  {ind}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-ink/35 mt-3">
          Geser ke bawah untuk lihat lainnya
        </p>
      </div>

      {/* DESKTOP — clean grid, no gimmicks */}
      <div className="hidden md:grid md:grid-cols-6 gap-4 mt-12">
        {INDUSTRIES.map((ind) => {
          const Icon = getIndustryIcon(ind);
          return (
            <div
              key={ind}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden hover-lift"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getIndustryImage(ind)}
                alt={ind}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                <Icon className="w-4 h-4 text-ink" strokeWidth={1.5} />
              </div>
              <span className="absolute bottom-4 left-4 right-4 text-white font-medium text-sm">
                {ind}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
