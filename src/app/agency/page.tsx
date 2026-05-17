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
  billingName: string | null;
  billingSiret: string | null;
  billingVatNumber: string | null;
  billingAddress: string | null;
  billingCountry: string | null;
  defaultCommissionPercent: number | null;
  defaultPaymentTerms: string | null;
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
  presskitUrl: string | null;
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

  // Billing edit form
  const [editingBilling, setEditingBilling] = useState(false);
  const [billingName, setBillingName] = useState("");
  const [billingSiret, setBillingSiret] = useState("");
  const [billingVatNumber, setBillingVatNumber] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [defaultCommissionPercent, setDefaultCommissionPercent] = useState("");
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState("");
  const [savingBilling, setSavingBilling] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Presskit edit
  const [editingPresskitId, setEditingPresskitId] = useState<string | null>(null);
  const [presskitUrl, setPresskitUrl] = useState("");
  const [savingPresskit, setSavingPresskit] = useState(false);
  const [copiedPresskitId, setCopiedPresskitId] = useState<string | null>(null);

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

  function openBillingEdit() {
    setBillingName(agency?.billingName ?? "");
    setBillingSiret(agency?.billingSiret ?? "");
    setBillingVatNumber(agency?.billingVatNumber ?? "");
    setBillingAddress(agency?.billingAddress ?? "");
    setBillingCountry(agency?.billingCountry ?? "");
    setDefaultCommissionPercent(agency?.defaultCommissionPercent?.toString() ?? "");
    setDefaultPaymentTerms(agency?.defaultPaymentTerms ?? "");
    setBillingError(null);
    setEditingBilling(true);
  }

  async function handleSaveBilling(e: React.FormEvent) {
    e.preventDefault();
    setSavingBilling(true);
    setBillingError(null);
    try {
      const updated = await api.put<Agency>("/api/agency", {
        billingName: billingName.trim() || null,
        billingSiret: billingSiret.trim() || null,
        billingVatNumber: billingVatNumber.trim() || null,
        billingAddress: billingAddress.trim() || null,
        billingCountry: billingCountry.trim() || null,
        defaultCommissionPercent: defaultCommissionPercent ? parseFloat(defaultCommissionPercent) : null,
        defaultPaymentTerms: defaultPaymentTerms.trim() || null,
      });
      setAgency(updated);
      setEditingBilling(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
      setBillingError(message);
    } finally {
      setSavingBilling(false);
    }
  }

  function handleCopyBilling() {
    const lines = [
      agency?.billingName,
      agency?.billingSiret ? `SIRET : ${agency.billingSiret}` : null,
      agency?.billingVatNumber ? `N°TVA : ${agency.billingVatNumber}` : null,
      agency?.billingAddress,
      agency?.billingCountry,
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  async function handleSavePresskit(artistId: string) {
    setSavingPresskit(true);
    try {
      await api.put(`/api/artists/${artistId}/presskit`, {
        presskitUrl: presskitUrl.trim() || null,
      });
      setArtists((prev) =>
        prev.map((a) => (a.id === artistId ? { ...a, presskitUrl: presskitUrl.trim() || null } : a))
      );
      setEditingPresskitId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur";
      alert(message);
    } finally {
      setSavingPresskit(false);
    }
  }

  function handleCopyPresskit(artistId: string, url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedPresskitId(artistId);
      setTimeout(() => setCopiedPresskitId(null), 2000);
    });
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
              className={`px-6 py-3 text-base font-medium transition-colors relative ${
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
                        className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
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

                        {/* Presskit */}
                        <div className="mt-2 pl-11">
                          {editingPresskitId === artist.id ? (
                            <div className="flex gap-2 items-center">
                              <input
                                type="url"
                                value={presskitUrl}
                                onChange={(e) => setPresskitUrl(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                              />
                              <button
                                onClick={() => handleSavePresskit(artist.id)}
                                disabled={savingPresskit}
                                className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                              >
                                {savingPresskit ? "..." : "OK"}
                              </button>
                              <button
                                onClick={() => setEditingPresskitId(null)}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {artist.presskitUrl ? (
                                <>
                                  <a
                                    href={artist.presskitUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-2.5 py-1 rounded-md"
                                    title="Ouvrir le presskit"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10m-4-8h5m0 0v5m0-5L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Presskit
                                  </a>
                                  <button
                                    onClick={() => handleCopyPresskit(artist.id, artist.presskitUrl!)}
                                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors bg-gray-800 px-2 py-1 rounded-md border border-gray-700"
                                    title="Copier le lien"
                                  >
                                    {copiedPresskitId === artist.id ? (
                                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    ) : (
                                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                                        <path d="M10.5 5.5V3.5a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h2" stroke="currentColor" strokeWidth="1.5"/>
                                      </svg>
                                    )}
                                    {copiedPresskitId === artist.id ? "Copie !" : "Copier"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPresskitUrl(artist.presskitUrl ?? "");
                                      setEditingPresskitId(artist.id);
                                    }}
                                    className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-800"
                                    title="Modifier le lien"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setPresskitUrl("");
                                    setEditingPresskitId(artist.id);
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-400 transition-colors"
                                >
                                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10m-4-8h5m0 0v5m0-5L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Ajouter un presskit
                                </button>
                              )}
                            </div>
                          )}
                        </div>
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

                {/* Default proposal values */}
                <div className="mb-8 p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Valeurs par defaut des propositions</h2>
                    {!editingBilling && (
                      <button
                        onClick={openBillingEdit}
                        className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 border border-gray-700 rounded-lg"
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Ces valeurs seront pre-remplies lors de la creation d&apos;une nouvelle proposition.</p>

                  {editingBilling ? (
                    <form onSubmit={handleSaveBilling} className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Commission (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={defaultCommissionPercent}
                          onChange={(e) => setDefaultCommissionPercent(e.target.value)}
                          placeholder="15"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Conditions de paiement</label>
                        <textarea
                          value={defaultPaymentTerms}
                          onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                          placeholder="50% à la signature ; 50% le lendemain"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500 min-h-[60px] resize-y"
                        />
                      </div>
                      <div className="pt-4 border-t border-gray-700 mt-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Facturation</h4>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Nom</label>
                          <input
                            type="text"
                            value={billingName}
                            onChange={(e) => setBillingName(e.target.value)}
                            placeholder="Nom ou raison sociale"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">SIRET</label>
                          <input
                            type="text"
                            value={billingSiret}
                            onChange={(e) => setBillingSiret(e.target.value)}
                            placeholder="123 456 789 00012"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">N°TVA</label>
                          <input
                            type="text"
                            value={billingVatNumber}
                            onChange={(e) => setBillingVatNumber(e.target.value)}
                            placeholder="FR 12 345678901"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Adresse</label>
                          <input
                            type="text"
                            value={billingAddress}
                            onChange={(e) => setBillingAddress(e.target.value)}
                            placeholder="12 rue de la Paix, 75001 Paris"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Pays</label>
                          <input
                            type="text"
                            value={billingCountry}
                            onChange={(e) => setBillingCountry(e.target.value)}
                            placeholder="France"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      {billingError && (
                        <p className="text-red-400 text-sm">{billingError}</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={savingBilling}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
                        >
                          {savingBilling ? "Enregistrement..." : "Enregistrer"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBilling(false)}
                          className="text-gray-400 hover:text-white px-5 py-2 rounded-lg text-sm transition-colors border border-gray-700"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Commission</label>
                        <p className="text-sm mt-1">{agency?.defaultCommissionPercent != null ? `${agency.defaultCommissionPercent}%` : <span className="text-gray-600 italic">Non definie</span>}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Conditions de paiement</label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{agency?.defaultPaymentTerms || <span className="text-gray-600 italic">Non definies</span>}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Billing info */}
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Facturation</h2>
                    {!editingBilling && (
                      <button
                        onClick={openBillingEdit}
                        className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 border border-gray-700 rounded-lg"
                      >
                        Modifier
                      </button>
                    )}
                  </div>

                  {!editingBilling && (
                    <div>
                      {!agency?.billingName && !agency?.billingSiret && !agency?.billingVatNumber && !agency?.billingAddress && !agency?.billingCountry ? (
                        <p className="text-gray-500 text-sm">Aucune information de facturation renseignee.</p>
                      ) : (
                        <div className="space-y-3">
                          {agency?.billingName && (
                            <div>
                              <label className="text-xs text-gray-500 uppercase tracking-wide">Nom</label>
                              <p className="text-sm mt-1">{agency.billingName}</p>
                            </div>
                          )}
                          {agency?.billingSiret && (
                            <div>
                              <label className="text-xs text-gray-500 uppercase tracking-wide">SIRET</label>
                              <p className="text-sm mt-1">{agency.billingSiret}</p>
                            </div>
                          )}
                          {agency?.billingVatNumber && (
                            <div>
                              <label className="text-xs text-gray-500 uppercase tracking-wide">N°TVA</label>
                              <p className="text-sm mt-1">{agency.billingVatNumber}</p>
                            </div>
                          )}
                          {agency?.billingAddress && (
                            <div>
                              <label className="text-xs text-gray-500 uppercase tracking-wide">Adresse</label>
                              <p className="text-sm mt-1">{agency.billingAddress}</p>
                            </div>
                          )}
                          {agency?.billingCountry && (
                            <div>
                              <label className="text-xs text-gray-500 uppercase tracking-wide">Pays</label>
                              <p className="text-sm mt-1">{agency.billingCountry}</p>
                            </div>
                          )}
                          <div className="pt-2">
                            <button
                              onClick={handleCopyBilling}
                              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 border border-gray-700 rounded-lg"
                            >
                              {copySuccess ? "Copie !" : "Copier tout"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
