"use client";

import type { Promoter } from "./types";

interface PromoterWithCount extends Promoter {
  _count?: { bookings: number };
}

interface Props {
  promoters: PromoterWithCount[];
  onEdit?: (promoter: Promoter) => void;
  onDelete?: (id: string) => void;
  onSelect: (promoter: PromoterWithCount) => void;
  readOnly?: boolean;
}

export default function PromoterList({ promoters, onEdit, onDelete, onSelect, readOnly }: Props) {
  if (promoters.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg mb-2">Aucun promoteur enregistré</p>
        <p className="text-sm">Ajoutez votre premier promoteur pour commencer</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {promoters.map((p) => (
        <div
          key={p.id}
          className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-gray-700 transition-colors cursor-pointer"
          onClick={() => onSelect(p)}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-white">{p.name}</h3>
              {p.company && (
                <p className="text-sm text-gray-400">{p.company}</p>
              )}
            </div>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
              {p._count?.bookings || 0} date{(p._count?.bookings || 0) !== 1 ? "s" : ""}
            </span>
          </div>

          {(p.email || p.phone) && (
            <div className="space-y-1 mb-3">
              {p.email && (
                <p className="text-sm text-gray-400 truncate">{p.email}</p>
              )}
              {p.phone && (
                <p className="text-sm text-gray-400">{p.phone}</p>
              )}
            </div>
          )}

          {(p.vatNumber || p.address1 || p.siret || p.ape || p.signatory) && (
            <div className="text-xs text-gray-500 border-t border-gray-800 pt-3 mt-3 space-y-1">
              {p.address1 && <p>Adresse : {p.address1}</p>}
              {p.siret && <p>SIRET : {p.siret}</p>}
              {p.ape && <p>APE : {p.ape}</p>}
              {p.vatNumber && <p>TVA : {p.vatNumber}</p>}
              {p.signatory && (
                <p>Signataire : {p.signatory}{p.signatoryRole ? ` (${p.signatoryRole})` : ""}</p>
              )}
            </div>
          )}

          {!readOnly && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(p); }}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(p.id); }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Supprimer
            </button>
          </div>
          )}
        </div>
      ))}
    </div>
  );
}
