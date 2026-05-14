"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { SECTIONS } from "@/app/advancing/[formId]/page";
import type { AdvancingForm, AdvancingFieldValue, SectionDef, FieldDef } from "@/app/advancing/[formId]/page";

interface AdvancingAccessItem {
  id: string;
  email: string;
  createdAt: string;
}

interface AdvancingFormData {
  id: string;
  status: string;
  totalFields: number;
  sentFields: number;
  validatedFields: number;
  accesses: AdvancingAccessItem[];
  createdAt: string;
}

export default function AdvancingReview({ bookingId }: { bookingId: string }) {
  const [formData, setFormData] = useState<AdvancingFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openPanel, setOpenPanel] = useState(false);
  const [reviewForm, setReviewForm] = useState<AdvancingForm | null>(null);

  useEffect(() => {
    loadForm();
  }, [bookingId]);

  async function loadForm() {
    setLoading(true);
    try {
      const data = await api.get<AdvancingFormData | null>(`/api/bookings/${bookingId}/advancing`);
      // A 204 No Content returns {} — treat it as null (no form exists)
      setFormData(data && data.id ? data : null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function loadReview() {
    try {
      const data = await api.get<AdvancingForm>(`/api/bookings/${bookingId}/advancing/review`);
      setReviewForm(data);
    } catch {
      setReviewForm(null);
    }
  }

  async function handleOpenPanel() {
    await loadReview();
    setOpenPanel(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await api.post<{ formId: string; publicUrl: string }>(`/api/bookings/${bookingId}/advancing`, { email: newEmail });
      await navigator.clipboard.writeText(result.publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      setNewEmail("");
      setShowCreate(false);
      loadForm();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeAccess(accessId: string) {
    if (!confirm("Revoquer cet acces ?")) return;
    try {
      await api.delete(`/api/bookings/${bookingId}/advancing/access/${accessId}`);
      loadForm();
    } catch {
      // ignore
    }
  }

  async function handleCopyLink(formId: string) {
    const url = `${window.location.origin}/advancing/${formId}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (loading) {
    return <div className="text-gray-400 text-sm py-4">Chargement...</div>;
  }

  const hasSentFields = formData != null && formData.sentFields > 0;

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Advancing</h3>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            + Send Link
          </button>
        </div>

        {copiedLink && (
          <div className="text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
            Link copied to clipboard!
          </div>
        )}

        {showCreate && (
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Promoter email"
              required
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs transition-colors"
            >
              {creating ? "..." : "Send"}
            </button>
          </form>
        )}

        {!formData && !showCreate && (
          <p className="text-sm text-gray-600 italic">Aucun advancing envoye</p>
        )}

        {formData && (
          <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-3 space-y-3">
            {/* Form status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  {new Date(formData.createdAt).toLocaleDateString("fr-FR")}
                  {formData.sentFields > 0 && (
                    <span className="ml-2">{formData.validatedFields}/{formData.sentFields} valides</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleCopyLink(formData.id)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Copy link
              </button>
            </div>

            {/* Access list */}
            {formData.accesses.length > 0 && (
              <div className="space-y-1">
                {formData.accesses.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">{a.email}</span>
                    <button
                      onClick={() => handleRevokeAccess(a.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Button to open full review panel */}
        {hasSentFields && (
          <button
            onClick={handleOpenPanel}
            className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-medium py-3 rounded-lg text-sm transition-colors border border-purple-500/30"
          >
            Review Advancing Form
          </button>
        )}
      </div>

      {/* Full-screen review panel */}
      {openPanel && reviewForm && (
        <AdvancingReviewPanel
          form={reviewForm}
          onClose={() => setOpenPanel(false)}
          onUpdate={loadReview}
        />
      )}
    </>
  );
}

// ======================== FULL REVIEW PANEL ========================

function AdvancingReviewPanel({
  form,
  onClose,
  onUpdate,
}: {
  form: AdvancingForm;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [localForm, setLocalForm] = useState(form);

  useEffect(() => {
    setLocalForm(form);
  }, [form]);

  async function handleValidate(fieldValue: AdvancingFieldValue) {
    setValidatingId(fieldValue.id);
    try {
      const updated = await api.put<AdvancingFieldValue>(`/api/advancing/fields/${fieldValue.id}/validate`);
      setLocalForm(prev => ({
        ...prev,
        fieldValues: prev.fieldValues.map(fv => fv.id === fieldValue.id ? updated : fv),
      }));
      onUpdate();
    } catch {
      // ignore
    } finally {
      setValidatingId(null);
    }
   }

  const getFieldValue = (section: string, key: string): AdvancingFieldValue | undefined => {
    return localForm.fieldValues.find(fv => fv.section === section && fv.fieldKey === key);
  };

  const dateStr = localForm.bookingDate
    ? new Date(localForm.bookingDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "";

  const totalAllFields = SECTIONS.reduce((sum, s) => sum + s.fields.length, 0);
  const validatedFields = localForm.fieldValues.filter(fv => fv.validatedAt).length;

  return (
    <div className="fixed inset-0 z-70 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-900 border-l border-gray-800 h-full overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-bold">Advancing Review</h2>
            <p className="text-sm text-gray-400">
              {localForm.artistName && <span>{localForm.artistName} — </span>}
              {dateStr}
              <span className="ml-3 text-xs text-gray-500">{validatedFields}/{totalAllFields}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl ml-4"
          >
            &times;
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-gray-800">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: totalAllFields > 0 ? `${(validatedFields / totalAllFields) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {/* Sections */}
        <div className="p-6 space-y-6">
          {SECTIONS.map(section => (
            <ReviewSection
              key={section.key}
              section={section}
              getFieldValue={getFieldValue}
              validatingId={validatingId}
              onValidate={handleValidate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  section,
  getFieldValue,
  validatingId,
  onValidate,
}: {
  section: SectionDef;
  getFieldValue: (section: string, key: string) => AdvancingFieldValue | undefined;
  validatingId: string | null;
  onValidate: (fv: AdvancingFieldValue) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="rounded-xl border border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3 flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wider">{section.label}</h3>
        <div className="flex items-center gap-2">
          <SectionProgress section={section} getFieldValue={getFieldValue} />
          <span className="text-gray-500 text-sm">{open ? "−" : "+"}</span>
        </div>
      </button>
      {open && (
        <div className="divide-y divide-gray-800/50">
          {section.fields.map(field => {
            const fv = getFieldValue(section.key, field.key);

            return (
              <ReviewField
                key={field.key}
                field={field}
                fieldValue={fv}
                validating={fv ? validatingId === fv.id : false}
                onValidate={fv ? () => onValidate(fv) : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function SectionProgress({
  section,
  getFieldValue,
}: {
  section: SectionDef;
  getFieldValue: (section: string, key: string) => AdvancingFieldValue | undefined;
}) {
  const total = section.fields.length;
  const validated = section.fields.filter(f => {
    const fv = getFieldValue(section.key, f.key);
    return fv?.validatedAt;
  }).length;

  const allDone = validated === total;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${allDone ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-400"}`}>
      {validated}/{total}
    </span>
  );
}

function ReviewField({
  field,
  fieldValue,
  validating,
  onValidate,
}: {
  field: FieldDef;
  fieldValue: AdvancingFieldValue | undefined;
  validating: boolean;
  onValidate?: () => void;
}) {
  const isFilled = fieldValue && fieldValue.value;
  const isValidated = !!fieldValue?.validatedAt;

  // Format display value
  let displayValue = "—";
  if (isFilled) {
    displayValue = fieldValue.value!;
    if (field.type === "boolean") {
      displayValue = fieldValue.value === "true" ? "Yes" : "No";
    }
  }

  return (
    <div className={`px-5 py-3 flex items-center gap-3 ${isValidated ? "bg-green-500/5" : !isFilled ? "opacity-40" : ""}`}>
      {/* Label + value */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{field.label}</p>
        <p className={`text-sm break-words ${isFilled ? "text-gray-200" : "text-gray-600 italic"}`}>
          {isFilled ? displayValue : "Non renseigné"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isValidated ? (
          <span className="text-xs text-green-400 px-3 py-1.5 rounded-lg bg-green-500/10 font-medium">
            Valide
          </span>
        ) : isFilled && onValidate ? (
          <button
            onClick={onValidate}
            disabled={validating}
            className="text-xs text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {validating ? "..." : "Valider"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
