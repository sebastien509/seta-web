import React from "react";
import Card from "./Card";
import Button from "./Button";

const DUMMY_CONTACTS = [
  { name: "Demo Merchant", address: "0x0000000000000000000000000000000000000001" },
  { name: "Demo User", address: "0x0000000000000000000000000000000000000002" },
];

export default function ContactSelector({ onClose, onSelect, currentAddress }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-slate-900">Select Contact</div>
          <button className="text-slate-500 hover:text-slate-900" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {DUMMY_CONTACTS.filter(c => c.address.toLowerCase() !== String(currentAddress || "").toLowerCase()).map((c) => (
            <button
              key={c.address}
              onClick={() => onSelect(c)}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50"
            >
              <div className="font-medium text-slate-900">{c.name}</div>
              <div className="text-sm text-slate-600">{c.address}</div>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
