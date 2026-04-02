import { useEffect, useMemo, useState, type FormEvent } from "react";
import RightDrawer from "../ui/RightDrawer";
import ErrorMessage from "../ErrorMessage";
import Loader from "../Loader";
import { companiesService } from "../../services/companies.service";
import type { Company } from "../../types/company";

type Props = {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onSubmitted: (message: string) => void;
};

function normalizeKyc(result: any) {
  const resolved = result?.data ?? result ?? null;
  if (!resolved) return null;

  return {
    business_legal_name: resolved.business_legal_name ?? "",
    owner_name: resolved.owner_name ?? "",
    tax_registration_number: resolved.tax_registration_number ?? "",
    bank_name: resolved.bank_name ?? "",
    bank_account_number: resolved.bank_account_number ?? "",
    bank_iban: resolved.bank_iban ?? "",
  };
}

function isPendingKyc(status?: string | null) {
  return (status || "").toUpperCase() === "PENDING_KYC";
}

export default function CompanyKycDrawer({
  open,
  company,
  onClose,
  onSubmitted,
}: Props) {
  const [form, setForm] = useState({
    business_legal_name: "",
    owner_name: "",
    tax_registration_number: "",
    bank_name: "",
    bank_account_number: "",
    bank_iban: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState("");

  const submitMode = isPendingKyc(company?.status);

  useEffect(() => {
    if (!open || !company?.id) return;

    setError("");
    setForm({
      business_legal_name: "",
      owner_name: "",
      tax_registration_number: "",
      bank_name: "",
      bank_account_number: "",
      bank_iban: "",
    });

    if (submitMode) {
      return;
    }

    setLoadingInitial(true);

    void companiesService
      .getCompanyKyc(company.id)
      .then((result) => {
        const normalized = normalizeKyc(result);
        if (!normalized) return;
        setForm(normalized);
      })
      .catch((err: any) => {
        const message = String(err?.message || "").toLowerCase();

        if (
          message.includes("not found") ||
          message.includes("404") ||
          message.includes("no kyc")
        ) {
          return;
        }

        setError(err.message || "Failed to load KYC data");
      })
      .finally(() => setLoadingInitial(false));
  }, [open, company?.id, submitMode]);

  const isValid = useMemo(() => {
    return (
      form.business_legal_name.trim() &&
      form.owner_name.trim() &&
      form.tax_registration_number.trim() &&
      form.bank_name.trim() &&
      form.bank_account_number.trim() &&
      form.bank_iban.trim()
    );
  }, [form]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!company?.id) {
      setError("Missing restaurant ID.");
      return;
    }

    if (!isValid) {
      setError("Please complete all KYC fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await companiesService.submitCompanyKyc(company.id, {
        business_legal_name: form.business_legal_name.trim(),
        owner_name: form.owner_name.trim(),
        tax_registration_number: form.tax_registration_number.trim(),
        bank_name: form.bank_name.trim(),
        bank_account_number: form.bank_account_number.trim(),
        bank_iban: form.bank_iban.trim(),
      });

      onSubmitted(result?.message || "KYC saved successfully.");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit KYC");
    } finally {
      setLoading(false);
    }
  };

  const drawerTitle = company
    ? `${submitMode ? "Submit KYC" : "View KYC"} · ${company.name}`
    : submitMode
    ? "Submit KYC"
    : "View KYC";

  const saveLabel = submitMode ? "Submit KYC" : "Save";

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title={drawerTitle}
      footer={
        <>
          <button className="button button-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-dark-btn"
            type="submit"
            form="company-kyc-form"
            disabled={loading || loadingInitial}
          >
            {saveLabel}
          </button>
        </>
      }
    >
      <ErrorMessage message={error} />
      {(loading || loadingInitial) && (
        <Loader text={loadingInitial ? "Loading KYC..." : "Saving KYC..."} />
      )}

      <form id="company-kyc-form" className="drawer-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label className="field-label" htmlFor="business-legal-name">
            Business Legal Name
          </label>
          <input
            id="business-legal-name"
            className="input"
            placeholder="Enter business legal name"
            value={form.business_legal_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, business_legal_name: e.target.value }))
            }
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="owner-name">
            Owner Name
          </label>
          <input
            id="owner-name"
            className="input"
            placeholder="Enter owner name"
            value={form.owner_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, owner_name: e.target.value }))
            }
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="tax-registration-number">
            Tax Registration Number
          </label>
          <input
            id="tax-registration-number"
            className="input"
            placeholder="Enter tax registration number"
            value={form.tax_registration_number}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tax_registration_number: e.target.value,
              }))
            }
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="bank-name">
            Bank Name
          </label>
          <input
            id="bank-name"
            className="input"
            placeholder="Enter bank name"
            value={form.bank_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bank_name: e.target.value }))
            }
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="bank-account-number">
            Bank Account Number
          </label>
          <input
            id="bank-account-number"
            className="input"
            placeholder="Enter bank account number"
            value={form.bank_account_number}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bank_account_number: e.target.value }))
            }
          />
        </div>

        <div className="form-field">
          <label className="field-label" htmlFor="bank-iban">
            Bank IBAN
          </label>
          <input
            id="bank-iban"
            className="input"
            placeholder="Enter bank IBAN"
            value={form.bank_iban}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bank_iban: e.target.value }))
            }
          />
        </div>
      </form>
    </RightDrawer>
  );
}
