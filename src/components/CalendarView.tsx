"use client";

import { useMemo, useState } from "react";
import type { BookingListItem } from "./types";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function CalendarView({
  bookings,
  onSelect,
}: {
  bookings: BookingListItem[];
  onSelect: (b: BookingListItem) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // Monday = 0
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { day: number; bookings: BookingListItem[] }[] = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: 0, bookings: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayBookings = bookings.filter((b) => {
        const bd = new Date(b.date);
        return (
          bd.getFullYear() === year &&
          bd.getMonth() === month &&
          bd.getDate() === d
        );
      });
      cells.push({ day: d, bookings: dayBookings });
    }

    return cells;
  }, [bookings, year, month]);

  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="text-gray-400 hover:text-white px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          &larr;
        </button>
        <h3 className="text-lg font-semibold">
          {MONTHS[month]} {year}
        </h3>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="text-gray-400 hover:text-white px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          &rarr;
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-800 rounded-xl overflow-hidden border border-gray-800">
        {DAYS.map((d) => (
          <div
            key={d}
            className="bg-gray-900 text-center text-xs text-gray-500 py-2 font-medium"
          >
            {d}
          </div>
        ))}
        {days.map((cell, i) => (
          <div
            key={i}
            className={`bg-gray-950 min-h-[100px] p-2 ${
              cell.day === 0 ? "bg-gray-900/30" : ""
            }`}
          >
            {cell.day > 0 && (
              <>
                <div
                  className={`text-xs mb-1 ${
                    isToday(cell.day)
                      ? "bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold"
                      : "text-gray-500"
                  }`}
                >
                  {cell.day}
                </div>
                {cell.bookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelect(b)}
                    className={`w-full text-left text-xs px-2 py-1 rounded mb-1 truncate transition-colors ${
                      b.status === "confirmed"
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : b.status === "cancelled"
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                    }`}
                  >
                    {b.venue} - {b.city}
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
