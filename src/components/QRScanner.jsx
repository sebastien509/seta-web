import React, { useState } from "react";
import Card from "./Card";
import Button from "./Button";

export default function QRScanner({ onClose, onScan, title = "Scan QR" }) {
  const [value, setValue] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <button className="text-slate-500 hover:text-slate-900" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="text-sm text-slate-600 mb-3">
          Camera scanner not wired yet. Paste QR payload here to simulate scanning.
        </div>

        <input
          className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none"
          placeholder="0x… or seta:…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (value) onScan(value);
            }}
            className="flex-1"
          >
            Use Value
          </Button>
        </div>
      </Card>
    </div>
  );
}
