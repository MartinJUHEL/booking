"use client";

import { useState } from "react";
import type { Promoter } from "./types";

interface Props {
  promoter: Promoter | null;
  onSave: (data: Partial<Promoter>) => void | Promise<void>;
  onClose: () => void;
}

export default function PromoterForm({ promoter, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: promoter?.name || "",
    email: promoter?.email || "",
    phone: promoter?.phone || "",
    company: promoter?.company || "",
    address1: promoter?.address1 || "",
    address2: promoter?.address2 || "",
    postalCode: promoter?.postalCode || "",
    city: promoter?.city || "",
    country: promoter?.country || "",
    companyWebsite: promoter?.companyWebsite || "",
    siret: promoter?.siret || "",
    ape: promoter?.ape || "",
    vatNumber: promoter?.vatNumber || "",
    signatory: promoter?.signatory || "",
    signatoryRole: promoter?.signatoryRole || "",
    notes: promoter?.notes || "",
  });

  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form as Partial<Promoter>);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">
            {promoter ? "Modifier le promoteur" : "Nouveau promoteur"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom du contact *">
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="input"
                placeholder="Jean Dupont"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="input"
                placeholder="contact@promoteur.com"
              />
            </Field>
          </div>
          <Field label="Téléphone">
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="input"
              placeholder="+33 6 12 34 56 78"
            />
          </Field>

          {/* Infos structure */}
          <div className="space-y-3 p-4 rounded-xl bg-gray-800/30 border border-gray-800">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Informations de la structure</h3>
            <Field label="Nom de la structure">
              <input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                className="input"
                placeholder="Live Nation SAS"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Adresse ligne 1">
                <input
                  value={form.address1}
                  onChange={(e) => set("address1", e.target.value)}
                  className="input"
                  placeholder="123 rue de la Musique"
                />
              </Field>
              <Field label="Adresse ligne 2">
                <input
                  value={form.address2}
                  onChange={(e) => set("address2", e.target.value)}
                  className="input"
                  placeholder="Bâtiment A"
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Code postal">
                <input
                  value={form.postalCode}
                  onChange={(e) => set("postalCode", e.target.value)}
                  className="input"
                  placeholder="75001"
                />
              </Field>
              <Field label="Ville">
                <input
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="input"
                  placeholder="Paris"
                />
              </Field>
              <Field label="Pays / État">
                <input
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="input"
                  placeholder="France"
                />
              </Field>
            </div>
            <Field label="Site web">
              <input
                type="url"
                value={form.companyWebsite}
                onChange={(e) => set("companyWebsite", e.target.value)}
                className="input"
                placeholder="https://www.example.com"
              />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="SIRET">
                <input
                  value={form.siret}
                  onChange={(e) => set("siret", e.target.value)}
                  className="input"
                  placeholder="123 456 789 00012"
                />
              </Field>
              <Field label="Code APE">
                <input
                  value={form.ape}
                  onChange={(e) => set("ape", e.target.value)}
                  className="input"
                  placeholder="9001Z"
                />
              </Field>
              <Field label="N° de TVA">
                <input
                  value={form.vatNumber}
                  onChange={(e) => set("vatNumber", e.target.value)}
                  className="input"
                  placeholder="FR12345678901"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Signataire">
                <input
                  value={form.signatory}
                  onChange={(e) => set("signatory", e.target.value)}
                  className="input"
                  placeholder="Jean Dupont"
                />
              </Field>
              <Field label="Qualité du signataire">
                <input
                  value={form.signatoryRole}
                  onChange={(e) => set("signatoryRole", e.target.value)}
                  className="input"
                  placeholder="Gérant, Président..."
                />
              </Field>
            </div>
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Informations complémentaires..."
            />
          </Field>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
            >
              {saving ? "Enregistrement..." : promoter ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-gray-400 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
