"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t-4 border-black py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6 md:col-span-2">
          <h2 className="font-['Anton'] text-5xl uppercase tracking-tighter">EShikhsha</h2>
          <p className="font-['Inter'] text-gray-600 max-w-sm">
            Disseminating verified intellectual assets and secure technical protocols for the elite academic elite.
          </p>
          <div className="flex gap-4">
             <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-['Anton'] hover:bg-black hover:text-white transition-all cursor-pointer">X</div>
             <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-['Anton'] hover:bg-black hover:text-white transition-all cursor-pointer">IG</div>
             <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-['Anton'] hover:bg-black hover:text-white transition-all cursor-pointer">TG</div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-['Bebas_Neue'] text-2xl uppercase tracking-widest text-black border-b-2 border-black inline-block">Directory</h3>
          <ul className="space-y-2 font-['Bebas_Neue'] text-lg uppercase tracking-wider">
            <li><Link href="/" className="hover:text-[#b83227]">Marketplace</Link></li>
            <li><Link href="/library" className="hover:text-[#b83227]">Personal Vault</Link></li>
            <li><Link href="/orders" className="hover:text-[#b83227]">Procurement</Link></li>
            <li><Link href="/contact" className="hover:text-[#b83227]">Encryption Support</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="font-['Bebas_Neue'] text-2xl uppercase tracking-widest text-black border-b-2 border-black inline-block">Security</h3>
          <ul className="space-y-2 font-['Bebas_Neue'] text-lg uppercase tracking-wider">
            <li className="text-gray-500">SSL STATUS: ENCRYPTED</li>
            <li className="text-gray-500">DATA SOVEREIGNTY: ACTIVE</li>
            <li className="text-gray-500">PAYMENT GATE: VERIFIED</li>
            <li className="text-gray-500">LEDGER TYPE: V-26</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-16 pt-8 border-t-2 border-black/10 flex flex-col md:flex-row justify-between items-center gap-4 font-['Bebas_Neue'] text-sm uppercase tracking-[0.2em] text-gray-400">
         <p>&copy; 2026 EShikhsha Universal // All Rights Reserved</p>
         <div className="flex gap-8">
            <span className="hover:text-black cursor-pointer">Privacy Protocol</span>
            <span className="hover:text-black cursor-pointer">Terms of Engagement</span>
         </div>
      </div>
    </footer>
  );
}
