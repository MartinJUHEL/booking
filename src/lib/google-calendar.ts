import { prisma } from "@/lib/prisma";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface BookingData {
  id: string;
  date: Date | string;
  time: string | null;
  venue: string;
  city: string;
  country: string;
  promoter: string;
  fee: number;
  status: string;
  contractSigned: boolean;
  notes: string | null;
  googleCalendarEventId: string | null;
}

/**
 * Get a valid Google access token for a user.
 * Refreshes the token if expired.
 */
async function getAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.access_token) return null;

  // Check if token is expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    if (!account.refresh_token) return null;

    // Refresh the token
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      }),
    });

    if (!response.ok) return null;

    const tokens = await response.json();

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token,
        expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
      },
    });

    return tokens.access_token;
  }

  return account.access_token;
}

/**
 * Get the user's calendar settings
 */
async function getCalendarSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleCalendarEnabled: true, googleCalendarId: true },
  });
  return user;
}

/**
 * Build a Google Calendar event body from a booking
 */
function buildCalendarEvent(booking: BookingData, appBaseUrl: string) {
  // All-day event: extract YYYY-MM-DD
  const eventDate = new Date(booking.date);
  const dateStr = eventDate.toISOString().split("T")[0]; // "2025-06-15"

  const statusEmoji =
    booking.status === "confirmed"
      ? "[OK]"
      : booking.status === "cancelled"
        ? "[X]"
        : "[?]";

  const description = [
    booking.time ? `Horaire: ${booking.time}` : "",
    `Promoter: ${booking.promoter}`,
    `Cachet: ${booking.fee} EUR`,
    `Statut: ${booking.status}`,
    `Contrat: ${booking.contractSigned ? "Signe" : "Non signe"}`,
    booking.notes ? `Notes: ${booking.notes}` : "",
    "",
    `Voir dans DJ Booking Manager:`,
    `${appBaseUrl}/?booking=${booking.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: `${statusEmoji} ${booking.venue} - ${booking.city} (${booking.country})`,
    description,
    location: `${booking.venue}, ${booking.city}, ${booking.country}`,
    start: {
      date: dateStr,
    },
    end: {
      date: dateStr,
    },
    colorId:
      booking.status === "confirmed"
        ? "10"
        : booking.status === "cancelled"
          ? "11"
          : "5", // green, red, yellow
  };
}

/**
 * Create or update a Google Calendar event for a booking
 */
export async function syncBookingToCalendar(
  userId: string,
  booking: BookingData,
  appBaseUrl: string
): Promise<string | null> {
  const settings = await getCalendarSettings(userId);
  if (!settings?.googleCalendarEnabled) return null;

  const accessToken = await getAccessToken(userId);
  if (!accessToken) return null;

  const calendarId = settings.googleCalendarId || "primary";
  const eventBody = buildCalendarEvent(booking, appBaseUrl);

  try {
    if (booking.googleCalendarEventId) {
      // Update existing event
      const res = await fetch(
        `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${booking.googleCalendarEventId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventBody),
        }
      );
      if (res.ok) {
        const event = await res.json();
        return event.id;
      }
      // If update fails (event deleted?), create a new one
    }

    // Create new event
    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (res.ok) {
      const event = await res.json();
      return event.id;
    }

    console.error("Google Calendar sync error:", await res.text());
    return null;
  } catch (error) {
    console.error("Google Calendar sync error:", error);
    return null;
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteBookingFromCalendar(
  userId: string,
  googleCalendarEventId: string
): Promise<void> {
  const settings = await getCalendarSettings(userId);
  if (!settings?.googleCalendarEnabled) return;

  const accessToken = await getAccessToken(userId);
  if (!accessToken) return;

  const calendarId = settings.googleCalendarId || "primary";

  try {
    await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${googleCalendarEventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
  } catch (error) {
    console.error("Google Calendar delete error:", error);
  }
}

/**
 * List the user's Google Calendars (for settings page)
 */
export async function listUserCalendars(
  userId: string
): Promise<{ id: string; summary: string; primary: boolean }[] | null> {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) return null;

  try {
    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/users/me/calendarList?minAccessRole=writer`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return (data.items || []).map(
      (cal: { id: string; summary: string; primary?: boolean }) => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary || false,
      })
    );
  } catch {
    return null;
  }
}
