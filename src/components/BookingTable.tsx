"use client";

import type { Booking } from "./types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
};

function Check({ checked }: { checked: boolean }) {
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
}: {
  bookings: Booking[];
  onEdit: (b: Booking) => void;
  onDelete: (id: string) => void;
  onSelect?: (b: Booking) => void;
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
            <th className="px-4 py-3 font-medium"></th>
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
                  {b.time && (
                    <div className="text-xs text-gray-500">{b.time}</div>
                  )}
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
                  <Check checked={b.contractSigned} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check checked={b.agencyFeesPaid} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check checked={b.artistFeesPaid} />
                </td>
                <td className="px-4 py-3 text-center" title={b.transportInfo || ""}>
                  <Check checked={b.transportBooked} />
                </td>
                <td className="px-4 py-3 text-center" title={b.hotel?.name || ""}>
                  <Check checked={b.hotel?.booked ?? false} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(b); }}
                    className="text-gray-500 hover:text-purple-400 transition-colors mr-2"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(b.id); }}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Suppr.
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
