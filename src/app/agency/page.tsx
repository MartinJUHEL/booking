"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";

interface Agency {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  invitedByName: string;
  createdAt: string;
  expiresAt: string;
}

export default function AgencyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const isOwner = agency?.ownerId === user?.id;

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.role !== "booker") router.replace("/");
    if (!loading && user && user.role === "booker" && !user.agencyId) router.replace("/onboarding");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "booker" || !user.agencyId) return;

    async function loadData() {
      setDataLoading(true);
      try {
        const [agencyData, membersData, invitationsData] = await Promise.all([
          api.get<Agency>("/api/agency"),
          api.get<Member[]>("/api/agency/members"),
          api.get<Invitation[]>("/api/agency/invitations"),
        ]);
        setAgency(agencyData);
        setMembers(membersData);
        setInvitations(invitationsData);
      } catch (err) {
        console.error("Failed to load agency data:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [user]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMessage(null);
    setInviteError(null);

    try {
      const res = await api.post<{ message: string; expiresAt: string }>("/api/agency/invite", {
        email: inviteEmail.trim(),
      });
      setInviteMessage(`Invitation envoyee a ${inviteEmail}. Le lien expire dans 5 minutes.`);
      setInviteEmail("");
      // Refresh invitations
      const invitationsData = await api.get<Invitation[]>("/api/agency/invitations");
      setInvitations(invitationsData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
      setInviteError(message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Retirer ${memberName} de l'agence ?`)) return;
    try {
      await api.delete(`/api/agency/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      if (agency) setAgency({ ...agency, memberCount: agency.memberCount - 1 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur";
      alert(message);
    }
  }

  if (loading || !user || user.role !== "booker" || !user.agencyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold hover:text-purple-400 transition-colors">
              Gigflow
            </Link>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
              Booker
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
              Dashboard
            </Link>
            <span className="text-sm text-purple-400 font-medium">Agence</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Chargement...</div>
          </div>
        ) : (
          <>
            {/* Agency info */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1">{agency?.name}</h1>
              <p className="text-gray-400 text-sm">
                {agency?.memberCount} membre{(agency?.memberCount ?? 0) > 1 ? "s" : ""}
              </p>
            </div>

            {/* Invite section */}
            <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-xl">
              <h2 className="text-lg font-semibold mb-4">Inviter un booker</h2>
              <p className="text-gray-400 text-sm mb-4">
                Un email sera envoye avec un lien d&apos;invitation valable 5 minutes.
              </p>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email du booker"
                  required
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
                >
                  {inviting ? "..." : "Envoyer l'invitation"}
                </button>
              </form>
              {inviteMessage && (
                <p className="text-green-400 text-sm mt-3">{inviteMessage}</p>
              )}
              {inviteError && (
                <p className="text-red-400 text-sm mt-3">{inviteError}</p>
              )}
            </div>

            {/* Pending invitations */}
            {invitations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Invitations en attente</h2>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
                    >
                      <div>
                        <span className="text-sm font-medium">{inv.email}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          par {inv.invitedByName}
                        </span>
                      </div>
                      <div className="text-xs text-amber-400">
                        Expire {new Date(inv.expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Membres</h2>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
                  >
                    {member.image ? (
                      <img
                        src={member.image}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                        {(member.name || member.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {member.name || member.email}
                        {member.id === agency?.ownerId && (
                          <span className="text-purple-400 text-xs ml-2">Admin</span>
                        )}
                        {member.id === user.id && (
                          <span className="text-gray-500 text-xs ml-2">(vous)</span>
                        )}
                      </div>
                      {member.name && (
                        <div className="text-xs text-gray-500">{member.email}</div>
                      )}
                    </div>
                    {isOwner && member.id !== user.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name || member.email)}
                        className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                        title="Retirer de l'agence"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
