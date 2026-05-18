"use client";

import { use } from "react";
import BookerBookingPage from "@/components/BookerBookingPage";

export default function BookingsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BookerBookingPage bookingId={id} />;
}
