"use client";

import { useState } from "react";
import type { Promoter } from "./types";

interface PromoterWithCount extends Promoter {
  _count?: { bookings: number };
}

export default function PromoterDetail({
  promoter,
  onClose,
  onEdit,
}: {
  promoter: PromoterWithCount;
  onClose: () => void;
  onEdit?: (p: Promoter) => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 h-full overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-bold truncate">{promoter.name}</h2>
            {promoter.company && (
              <p className="text-sm text-gray-400 truncate">{promoter.company}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
            <button
              onClick={() => onEdit(promoter)}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Modifier
            </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-xl ml-2"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</h3>
            <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-3">
              <CopyField label="Nom" value={promoter.name} />
              <CopyField label="Société" value={promoter.company} />
              <CopyField label="Email" value={promoter.email} />
              <CopyField label="Téléphone" value={promoter.phone} />
            </div>
          </section>

          {/* Informations légales */}
          {(promoter.headquarters || promoter.siret || promoter.ape || promoter.vatNumber) && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Informations légales</h3>
              <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-3">
                <CopyField label="Siège social" value={promoter.headquarters} />
                <CopyField label="SIRET" value={promoter.siret} mono />
                <CopyField label="Code APE" value={promoter.ape} mono />
                <CopyField label="N° TVA" value={promoter.vatNumber} mono />
              </div>
            </section>
          )}

          {/* Signataire */}
          {(promoter.signatory || promoter.signatoryRole) && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signataire</h3>
              <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-3">
                <CopyField label="Nom" value={promoter.signatory} />
                <CopyField label="Fonction" value={promoter.signatoryRole} />
              </div>
            </section>
          )}

          {/* Notes */}
          {promoter.notes && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</h3>
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{promoter.notes}</p>
            </section>
          )}

          {/* Stats */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Statistiques</h3>
            <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4">
              <p className="text-sm text-gray-400">
                <span className="text-white font-medium">{promoter._count?.bookings || 0}</span>{" "}
                date{(promoter._count?.bookings || 0) !== 1 ? "s" : ""} associée{(promoter._count?.bookings || 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CopyField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <div
      className="group flex items-start justify-between gap-2 cursor-pointer rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-700/30 transition-colors"
      onClick={handleCopy}
      title="Cliquer pour copier"
    >
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm text-gray-300 break-all ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-3">
        {copied ? "Copié !" : "Copier"}
      </span>
    </div>
  );
}
