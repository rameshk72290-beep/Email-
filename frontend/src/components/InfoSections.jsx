import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { infoContent, faqs } from "../mock";
import { Info } from "lucide-react";

export default function InfoSections() {
  return (
    <div className="space-y-6">
      {/* Top-up instructions */}
      <section className="rounded-2xl bg-[#141127] border border-[#272142] p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4">Top-up Instructions</h2>
        <div className="flex items-start gap-2 rounded-xl bg-[#1c1733] border border-[#2a2447] p-4 mb-4">
          <Info className="w-5 h-5 text-[#8b5cf6] shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed">
            Please be sure to fill in the required information accurately to prevent your Diamond
            top-up from being delayed. Free Fire top-up takes about 3–5 minutes. In special cases,
            the recharge arrival time may be delayed.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {[
            ["Applicable Platform", "Mobile game"],
            ["Required Information", "Free Fire UID"],
            ["Applicable Server", "Malaysia & Singapore, Americas (excl. Brazil), Europe"],
            ["Recharge Result", "After success, check your diamonds in the game."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-lg bg-[#171331] border border-[#272142] p-3">
              <p className="text-xs font-semibold text-[#8b5cf6] uppercase tracking-wide">{t}</p>
              <p className="text-gray-300 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Game info */}
      <section className="rounded-2xl bg-[#141127] border border-[#272142] p-5 sm:p-6 space-y-5">
        {infoContent.map((c) => (
          <div key={c.title}>
            <h3 className="font-display text-lg font-bold text-white mb-2">{c.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="rounded-2xl bg-[#141127] border border-[#272142] p-5 sm:p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4">F.A.Q.</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-[#272142]">
              <AccordionTrigger className="text-left text-sm font-semibold text-white hover:text-[#8b5cf6] hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-400 leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
