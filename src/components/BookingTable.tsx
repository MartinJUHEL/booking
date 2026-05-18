"use client";

import type { BookingListItem } from "./types";

const statusColors: Record<string, string> = {
  proposal: "bg-blue-500/20 text-blue-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  declined: "bg-red-500/20 text-red-400",
};

const statusLabels: Record<string, string> = {
  proposal: "Proposition",
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  declined: "Refusée",
};

function Check({ checked, onClick }: { checked: boolean; onClick?: () => void }) {
  if (onClick) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`inline-block w-5 h-5 rounded text-center text-xs leading-5 transition-colors ${
          checked
            ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
            : "bg-gray-800 text-gray-600 hover:bg-green-500/10 hover:text-green-500"
        }`}
        title={checked ? "Marquer comme non payé" : "Marquer comme payé"}
      >
        {checked ? "✓" : "–"}
      </button>
    );
  }
  return (
    <span
      className={`inline-block w-5 h-5 rounded text-center text-xs leading-5 ${
        checked
          ? "bg-green-500/20 text-green-400"
          : "bg-gray-800 text-gray-600"
      }`}
    >
      {checked ? "✓" : "–"}
    </span>
  );
}

export default function BookingTable({
  bookings,
  onEdit,
  onDelete,
  onSelect,
  onToggleField,
  readOnly,
}: {
  bookings: BookingListItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelect?: (b: BookingListItem) => void;
  onToggleField?: (id: string, field: "agencyFeesPaid" | "artistFeesPaid", value: boolean) => void;
  readOnly?: boolean;
}) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">Aucune date trouvée</p>
        <p className="text-sm mt-1">Ajoutez votre première date avec le bouton ci-dessus</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900/80 text-gray-400 text-left">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Venue</th>
            <th className="px-4 py-3 font-medium">Ville</th>
            <th className="px-4 py-3 font-medium">Promoter</th>
            <th className="px-4 py-3 font-medium text-right">Cachet</th>
            <th className="px-4 py-3 font-medium text-center">Statut</th>
            <th className="px-4 py-3 font-medium text-center">Contrat</th>
            <th className="px-4 py-3 font-medium text-center">Fees Ag.</th>
            <th className="px-4 py-3 font-medium text-center">Fees Art.</th>
            <th className="px-4 py-3 font-medium text-center">Transport</th>
            <th className="px-4 py-3 font-medium text-center">Hotel</th>
            {!readOnly && <th className="px-4 py-3 font-medium"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {bookings.map((b) => {
            const isPast = new Date(b.date) < new Date();
            return (
              <tr
                key={b.id}
                onClick={() => onSelect?.(b)}
                className={`hover:bg-gray-900/50 transition-colors cursor-pointer ${
                  isPast ? "opacity-50" : ""
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium">
                    {new Date(b.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{b.venue}</td>
                <td className="px-4 py-3">
                  <span className="text-gray-300">{b.city}</span>
                  <span className="text-gray-600 ml-1">({b.country})</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{b.promoter}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {b.fee.toLocaleString("fr-FR")} €
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[b.status] || ""
                    }`}
                  >
                    {statusLabels[b.status] || b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {!b.contractSigned && b.status === "confirmed" ? (
                    <span className="inline-flex items-center justify-center w-5 h-5" title="Contrat non signé">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    </span>
                  ) : (
                    <Check checked={b.contractSigned} />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Check checked={b.agencyFeesPaid} onClick={onToggleField ? () => onToggleField(b.id, "agencyFeesPaid", !b.agencyFeesPaid) : undefined} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check checked={b.artistFeesPaid} onClick={onToggleField ? () => onToggleField(b.id, "artistFeesPaid", !b.artistFeesPaid) : undefined} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check checked={b.transportBooked} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check checked={b.hotelBooked} />
                </td>
                {!readOnly && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(b.id); }}
                    className="text-gray-500 hover:text-purple-400 transition-colors mr-2"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(b.id); }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Suppr.
                  </button>
                </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
