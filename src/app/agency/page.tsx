"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import HeaderBar from "@/components/HeaderBar";

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

interface Artist {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  artistName: string | null;
}

type Tab = "artistes" | "bookers" | "infos";

export default function AgencyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("artistes");
  const [agency, setAgency] = useState<Agency | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Invite booker form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Invite artist form
  const [artistEmail, setArtistEmail] = useState("");
  const [invitingArtist, setInvitingArtist] = useState(false);
  const [artistMessage, setArtistMessage] = useState<string | null>(null);
  const [artistError, setArtistError] = useState<string | null>(null);

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
        const [agencyData, membersData, invitationsData, artistsData] = await Promise.all([
          api.get<Agency>("/api/agency"),
          api.get<Member[]>("/api/agency/members"),
          api.get<Invitation[]>("/api/agency/invitations"),
          api.get<Artist[]>("/api/artists"),
        ]);
        setAgency(agencyData);
        setMembers(membersData);
        setInvitations(invitationsData);
        setArtists(artistsData);
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
      await api.post<{ message: string; expiresAt: string }>("/api/agency/invite", {
        email: inviteEmail.trim(),
      });
      setInviteMessage(`Invitation envoyee a ${inviteEmail}. Le lien expire dans 5 minutes.`);
      setInviteEmail("");
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

  async function handleInviteArtist(e: React.FormEvent) {
    e.preventDefault();
    if (!artistEmail.trim()) return;
    setInvitingArtist(true);
    setArtistMessage(null);
    setArtistError(null);

    try {
      await api.post("/api/artists", { email: artistEmail.trim() });
      setArtistMessage(`Invitation envoyee a ${artistEmail}.`);
      setArtistEmail("");
      const artistsData = await api.get<Artist[]>("/api/artists");
      setArtists(artistsData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
      setArtistError(message);
    } finally {
      setInvitingArtist(false);
    }
  }

  async function handleRemoveArtist(artistId: string, artistName: string) {
    if (!confirm(`Retirer ${artistName} de votre liste d'artistes ?`)) return;
    try {
      await api.delete(`/api/artists/${artistId}`);
      setArtists((prev) => prev.filter((a) => a.id !== artistId));
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

  const tabs: { key: Tab; label: string }[] = [
    { key: "artistes", label: "Artistes" },
    { key: "bookers", label: "Bookers" },
    { key: "infos", label: "Infos" },
  ];

  return (
    <div className="min-h-screen">
      <HeaderBar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Agency name */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{agency?.name}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Chargement...</div>
          </div>
        ) : (
          <>
            {/* ============ ARTISTES TAB ============ */}
            {activeTab === "artistes" && (
              <div>
                {/* Invite artist */}
                <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <h2 className="text-lg font-semibold mb-2">Inviter un artiste</h2>
                  <p className="text-gray-400 text-sm mb-4">
                    Invitez un artiste par email. Il recevra un lien pour accepter l&apos;invitation.
                  </p>
                  <form onSubmit={handleInviteArtist} className="flex gap-2">
                    <input
                      type="email"
                      value={artistEmail}
                      onChange={(e) => setArtistEmail(e.target.value)}
                      placeholder="Email de l'artiste"
                      required
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={invitingArtist}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
                    >
                      {invitingArtist ? "..." : "Inviter"}
                    </button>
                  </form>
                  {artistMessage && (
                    <p className="text-green-400 text-sm mt-3">{artistMessage}</p>
                  )}
                  {artistError && (
                    <p className="text-red-400 text-sm mt-3">{artistError}</p>
                  )}
                </div>

                {/* Artists list */}
                {artists.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucun artiste pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {artists.map((artist) => (
                      <div
                        key={artist.id}
                        className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
                      >
                        {artist.image ? (
                          <img
                            src={artist.image}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                            {(artist.artistName || artist.name || artist.email)[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {artist.artistName || artist.name || artist.email}
                          </div>
                          <div className="text-xs text-gray-500">{artist.email}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveArtist(artist.id, artist.artistName || artist.name || artist.email)}
                          className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                          title="Retirer l'artiste"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============ BOOKERS TAB ============ */}
            {activeTab === "bookers" && (
              <div>
                {/* Invite booker */}
                <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <h2 className="text-lg font-semibold mb-2">Inviter un booker</h2>
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
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Invitations en attente</h3>
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

                {/* Members list */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Bookers ({members.length})
                  </h3>
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
              </div>
            )}

            {/* ============ INFOS TAB ============ */}
            {activeTab === "infos" && (
              <div>
                {/* Agency details */}
                <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <h2 className="text-lg font-semibold mb-4">Informations de l&apos;agence</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Nom</label>
                      <p className="text-sm mt-1">{agency?.name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Bookers</label>
                      <p className="text-sm mt-1">
                        {agency?.memberCount} booker{(agency?.memberCount ?? 0) > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Artistes</label>
                      <p className="text-sm mt-1">{artists.length} artiste{artists.length > 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Creee le</label>
                      <p className="text-sm mt-1">
                        {agency?.createdAt
                          ? new Date(agency.createdAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Billing info placeholder */}
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <h2 className="text-lg font-semibold mb-4">Facturation</h2>
                  <p className="text-gray-500 text-sm">
                    Les informations de facturation seront disponibles prochainement.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
