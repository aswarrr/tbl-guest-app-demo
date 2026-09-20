import { ReservationFrame, ReservationLocations } from "../../website/reservation-presentation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PaymentModal from "../../components/site/PaymentModal";
import PaymentMethodSelector from "../../components/site/PaymentMethodSelector";
import useAuth from "../../hooks/useAuth";
import useTenant from "../../hooks/useTenant";
import useTenantPath from "../../hooks/useTenantPath";
import { customerService } from "../../white-label/customer.service";
import { addDays, branchLocalDate, branchShortName, formatDate, formatMoney, formatTime } from "../../white-label/format";
import { clearReservationDraft, loadReservationDraft, saveReservationDraft } from "../../white-label/tenant";
import { useFeatures } from "../../website/features";
import FloorplanPicker from "../../components/site/floorplan/FloorplanPicker";
import type { GuestFloorplan } from "../../components/site/floorplan/types";
import type { AvailableFloor, CustomerReservation, PaymentMethod, PaymentProvider, ReservationDraft } from "../../white-label/types";

/**
 * Everything the checkout modal needs to render, whichever provider is in play.
 * Paymob uses checkoutUrl; Stripe uses the other three.
 */
type PaymentSession = {
  paymentId: string;
  provider: PaymentProvider;
  checkoutUrl?: string | null;
  clientSecret?: string | null;
  publishableKey?: string | null;
  connectedAccountId?: string | null;
};

/** A session plus the reservation it belongs to, as stashed for resume. */
type PendingPayment = PaymentSession & { reservation: CustomerReservation };

function stripSession({ reservation, ...session }: PendingPayment): PaymentSession {
  void reservation;
  return session;
}

function sameTableIds(left: string[], right: string[]) {
  return left.length === right.length && [...left].sort().every((id, index) => id === [...right].sort()[index]);
}

function HoldCountdown({ expiresAt }: { expiresAt: string | null }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);
  if (!expiresAt) return null;
  if (now === 0) return <span>Table hold is active</span>;
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  return <span className={seconds < 60 ? "is-urgent" : ""}>Table held for {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>;
}

export default function ReservePage() {
  const { tenant, tenantSlug, branches } = useTenant();
  const tenantPath = useTenantPath();
  const features = useFeatures();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingPaymentKey = `tavlo.pending-payment:${tenantSlug}`;
  const pendingPayment = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(pendingPaymentKey) || "null") as PendingPayment | null;
    } catch {
      return null;
    }
  }, [pendingPaymentKey]);
  const queryBranch = searchParams.get("branch");
  const storedDraft = useMemo(() => loadReservationDraft(tenantSlug), [tenantSlug]);
  const saved = queryBranch && queryBranch !== storedDraft?.branchId ? null : storedDraft;
  const initialBranch = branches.find((branch) => branch.id === queryBranch)?.id || branches.find((branch) => branch.id === saved?.branchId)?.id || branches[0]?.id || "";
  const initialDetail = branches.find((branch) => branch.id === initialBranch) || branches[0];
  const today = branchLocalDate(initialDetail?.timezone || "Africa/Cairo");
  const [draft, setDraft] = useState<ReservationDraft>(() => saved ? {
    ...saved,
    paymentMethod: saved.paymentMethod ?? null,
  } : {
    version: 1,
    step: 1,
    branchId: initialBranch,
    partySize: Math.max(2, initialDetail?.policies.minPartySize || 1),
    reservationDate: today,
    durationMinutes: Math.max(60, initialDetail?.policies.minReservationDurationMinutes || 60),
    reservationTimeLocal: "",
    floorId: "",
    seatingOption: null,
    specialRequest: "",
    paymentMethod: null,
  });
  const [times, setTimes] = useState<string[]>([]);
  const [floors, setFloors] = useState<AvailableFloor[]>([]);
  const [floorplan, setFloorplan] = useState<GuestFloorplan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reservation, setReservation] = useState<CustomerReservation | null>(pendingPayment?.reservation || null);
  const [payment, setPayment] = useState<PaymentSession | null>(pendingPayment ? stripSession(pendingPayment) : null);
  const [paymentOpen, setPaymentOpen] = useState(Boolean(pendingPayment));

  /**
   * Refresh a resumed Stripe session from the server.
   *
   * A clientSecret stashed in sessionStorage can be stale by the time the guest
   * comes back — the intent may have succeeded, failed, or been superseded. The
   * server holds the live attempt, so on resume we re-read rather than trusting
   * what we stored. Paymob's checkoutUrl does not have this problem, so it is
   * left alone.
   */
  useEffect(() => {
    if (!pendingPayment || pendingPayment.provider !== "STRIPE") return;
    let cancelled = false;

    void customerService
      .getPaymentStatus(pendingPayment.paymentId)
      .then((status) => {
        if (cancelled) return;
        if (!status.clientSecret) return;
        setPayment((current) =>
          current
            ? {
                ...current,
                clientSecret: status.clientSecret ?? current.clientSecret,
                publishableKey: status.publishableKey ?? current.publishableKey,
                connectedAccountId: status.connectedAccountId ?? current.connectedAccountId,
              }
            : current,
        );
      })
      .catch(() => {
        // Leave the stored session in place; the modal's own polling will
        // surface a terminal state if this one is no longer usable.
      });

    return () => { cancelled = true; };
  }, [pendingPayment]);

  const branch = branches.find((item) => item.id === draft.branchId) || branches[0];
  const policy = branch?.policies;
  const requiresPayment = Boolean(policy?.depositRequired && (policy.depositAmount || 0) > 0);
  const activeFloor = floors.find((floor) => floor.id === draft.floorId) || floors[0];
  // Step numbers stay 1-4 whatever the restaurant offers, because a saved draft
  // carries one; when tables are assigned rather than chosen, step 3 is simply
  // never visited and the progress bar shows three stages.
  const stepOrder = useMemo(
    () => (features.tableSelection ? [1, 2, 3, 4] : [1, 2, 4]),
    [features.tableSelection],
  );
  const stepLabels = features.tableSelection
    ? ["Branch", "Date & time", "Your table", "Review"]
    : ["Branch", "Date & time", "Review"];
  const stepIndex = Math.max(1, stepOrder.indexOf(draft.step) + 1);
  const goToStep = (delta: number) =>
    setDraft((current) => {
      const at = stepOrder.indexOf(current.step);
      const next = stepOrder[Math.min(stepOrder.length - 1, Math.max(0, at + delta))];
      return { ...current, step: next ?? current.step };
    });
  const partySizes = useMemo(() => Array.from({ length: Math.max(1, (policy?.maxPartySize || 20) - (policy?.minPartySize || 1) + 1) }, (_, index) => (policy?.minPartySize || 1) + index), [policy?.maxPartySize, policy?.minPartySize]);
  const durations = useMemo(() => {
    const min = policy?.minReservationDurationMinutes || 60;
    const max = policy?.maxReservationDurationMinutes || 90;
    const values = [];
    for (let value = min; value <= max; value += 30) values.push(value);
    return values;
  }, [policy?.maxReservationDurationMinutes, policy?.minReservationDurationMinutes]);

  useEffect(() => saveReservationDraft(tenantSlug, draft), [draft, tenantSlug]);

  // A draft saved while guests still chose their own table can name a step the
  // flow no longer has. Move it on rather than showing an empty panel.
  useEffect(() => {
    if (features.tableSelection || draft.step !== 3) return;
    setDraft((current) => ({ ...current, step: 4, seatingOption: null, floorId: "" }));
  }, [features.tableSelection, draft.step]);

  useEffect(() => {
    if (draft.step !== 2 || !draft.branchId || !draft.reservationDate) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    void customerService.getBlindAvailability(draft.branchId, { date: draft.reservationDate, partySize: draft.partySize, durationMinutes: draft.durationMinutes })
      .then((result) => { if (!cancelled) setTimes(result.times || []); })
      .catch((nextError: unknown) => { if (!cancelled) { setTimes([]); setError(nextError instanceof Error ? nextError.message : "Could not load available times."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [draft.branchId, draft.durationMinutes, draft.partySize, draft.reservationDate, draft.step]);

  // The layout only changes when the restaurant republishes it, so it is keyed
  // to the branch alone and not to the date or party size. A failure here is
  // deliberately silent: the picker falls back to its list and a booking still
  // goes through.
  useEffect(() => {
    if (!features.tableSelection || draft.step < 3 || !draft.branchId) return;
    let cancelled = false;
    void customerService
      .getBranchFloorplan(draft.branchId)
      .then((result) => { if (!cancelled) setFloorplan(result); })
      .catch(() => { if (!cancelled) setFloorplan(null); });
    return () => { cancelled = true; };
  }, [draft.branchId, draft.step, features.tableSelection]);

  useEffect(() => {
    if (!features.tableSelection || draft.step < 3 || !draft.reservationTimeLocal) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    void customerService.getFloorsAvailability(draft.branchId, { date: draft.reservationDate, partySize: draft.partySize, durationMinutes: draft.durationMinutes, time: draft.reservationTimeLocal })
      .then((result) => {
        if (cancelled) return;
        setFloors(result.floors || []);
        if (result.floors[0]) {
          setDraft((current) => current.floorId ? current : { ...current, floorId: result.floors[0].id });
        }
      })
      .catch((nextError: unknown) => { if (!cancelled) { setFloors([]); setError(nextError instanceof Error ? nextError.message : "Could not load available tables."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [draft.branchId, draft.durationMinutes, draft.partySize, draft.reservationDate, draft.reservationTimeLocal, draft.step, features.tableSelection]);

  const updateDiningDetails = (changes: Partial<ReservationDraft>) => {
    setDraft((current) => ({ ...current, ...changes, reservationTimeLocal: "", floorId: "", seatingOption: null }));
  };

  const chooseBranch = (branchId: string) => {
    const selected = branches.find((item) => item.id === branchId);
    if (!selected) return;
    setDraft((current) => ({ ...current, branchId, partySize: Math.max(2, selected.policies.minPartySize || 1), reservationDate: branchLocalDate(selected.timezone), durationMinutes: Math.max(60, selected.policies.minReservationDurationMinutes || 60), reservationTimeLocal: "", floorId: "", seatingOption: null }));
  };

  const finishReservation = useCallback((confirmed: CustomerReservation) => {
    sessionStorage.setItem(`tavlo.confirmation:${confirmed.id}`, JSON.stringify(confirmed));
    sessionStorage.removeItem(pendingPaymentKey);
    clearReservationDraft(tenantSlug);
    setPaymentOpen(false);
    setPayment(null);
    navigate(`${tenantPath("reservation")}/${confirmed.id}/confirmation`, { state: { reservation: confirmed } });
  }, [navigate, pendingPaymentKey, tenantSlug, tenantPath]);

  const submitReservation = async () => {
    if (!branch) return;
    if (features.tableSelection && !draft.seatingOption) return;
    if (!isAuthenticated) {
      saveReservationDraft(tenantSlug, { ...draft, step: 4 });
      navigate(`${tenantPath("auth/login")}?returnTo=${encodeURIComponent(`${tenantPath("reserve")}?resume=review`)}`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // A table the guest chose may have gone in the meantime, so it is
      // re-checked before the hold. When the server assigns the table there is
      // nothing to re-check: it picks from what is free at that moment.
      let tableIds: string[] | undefined;
      if (features.tableSelection) {
        const latest = await customerService.getFloorsAvailability(branch.id, { date: draft.reservationDate, partySize: draft.partySize, durationMinutes: draft.durationMinutes, time: draft.reservationTimeLocal });
        const stillAvailable = latest.floors.flatMap((floor) => floor.tables).find((option) => option.id === draft.seatingOption?.id && draft.seatingOption && sameTableIds(option.tableIds, draft.seatingOption.tableIds));
        if (!stillAvailable) {
          setFloors(latest.floors);
          setDraft((current) => ({ ...current, step: 3, floorId: latest.floors[0]?.id || "", seatingOption: null }));
          throw new Error("That table was just taken. Please choose another available table.");
        }
        tableIds = stillAvailable.tableIds;
      }

      const hold = await customerService.createHold(branch.id, {
        partySize: draft.partySize,
        reservationDate: draft.reservationDate,
        reservationTimeLocal: draft.reservationTimeLocal,
        durationMinutes: draft.durationMinutes,
        ...(tableIds ? { tableIds } : {}),
        specialRequest: draft.specialRequest.trim() || undefined,
      });
      setReservation(hold);

      if (hold.depositRequired && hold.depositAmount > 0) {
        const started = await customerService.startPayment(hold.id);
        // The server chose the provider; the guest just sees a checkout.
        const session: PaymentSession = {
          paymentId: started.paymentId,
          provider: started.provider ?? "PAYMOB",
          checkoutUrl: started.checkoutUrl ?? null,
          clientSecret: started.clientSecret ?? null,
          publishableKey: started.publishableKey ?? null,
          connectedAccountId: started.connectedAccountId ?? null,
        };
        setPayment(session);
        sessionStorage.setItem(pendingPaymentKey, JSON.stringify({ ...session, reservation: hold }));
        setPaymentOpen(true);
      } else {
        finishReservation(await customerService.confirmReservation(hold.id));
      }
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "We could not complete this reservation.";
      // The last table for this time went while the guest was reviewing. There
      // is nothing to choose differently, so send them back to pick another
      // time rather than leaving them on a dead Confirm button.
      if (!features.tableSelection && /no table is available/i.test(message))
        setDraft((current) => ({ ...current, step: 2, reservationTimeLocal: "" }));
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!tenant || !branch) return null;


  return (
    <><ReservationFrame step={stepIndex} steps={stepLabels} summary={<><span className="wl-kicker">Your reservation</span><img src={branch.coverImageUrl || branch.photos[0]?.url} alt="" /><h2>{branchShortName(branch)}</h2><p>{branch.addressSummary}</p><dl><div><dt>Date</dt><dd>{formatDate(draft.reservationDate, branch.timezone)}</dd></div><div><dt>Time</dt><dd>{draft.reservationTimeLocal ? formatTime(draft.reservationTimeLocal) : "Choose a time"}</dd></div><div><dt>Guests</dt><dd>{draft.partySize}</dd></div><div><dt>Table</dt><dd>{features.tableSelection ? draft.seatingOption?.name || "Choose a table" : "Reserved for you"}</dd></div></dl>{reservation ? <div className="wl-hold-timer"><HoldCountdown expiresAt={reservation.holdExpiresAt} /></div> : null}</>}>
          {error ? <div className="wl-inline-error" role="alert">{error}</div> : null}
          {draft.step === 1 ? (
            <ReservationLocations branches={branches} branchId={draft.branchId} chooseBranch={chooseBranch}/>
          ) : null}
          {draft.step === 2 ? (
            <div><span className="wl-kicker">Step 2</span><h2>When are you joining us?</h2><div className="wl-field-grid"><label>Party size<select value={draft.partySize} onChange={(event) => updateDiningDetails({ partySize: Number(event.target.value) })}>{partySizes.map((size) => <option key={size} value={size}>{size} {size === 1 ? "guest" : "guests"}</option>)}</select></label><label>Date<input type="date" min={branchLocalDate(branch.timezone)} max={addDays(branchLocalDate(branch.timezone), 90)} value={draft.reservationDate} onChange={(event) => updateDiningDetails({ reservationDate: event.target.value })} /></label><label>Duration<select value={draft.durationMinutes} onChange={(event) => updateDiningDetails({ durationMinutes: Number(event.target.value) })}>{durations.map((duration) => <option value={duration} key={duration}>{duration < 60 ? `${duration} min` : `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ""}`}</option>)}</select></label></div><div className="wl-time-heading"><h3>Available times</h3>{loading ? <span>Checking…</span> : null}</div><div className="wl-time-grid">{times.map((time) => <button className={draft.reservationTimeLocal === time ? "is-selected" : ""} type="button" key={time} onClick={() => setDraft((current) => ({ ...current, reservationTimeLocal: time, floorId: "", seatingOption: null }))}>{formatTime(time)}</button>)}</div>{!loading && times.length === 0 ? <p className="wl-empty">No tables match these details. Try another date or duration.</p> : null}</div>
          ) : null}
          {draft.step === 3 ? (
            <div><span className="wl-kicker">Step 3</span><h2>Choose your table</h2><p className="wl-caption">Tap a table to choose it. Dimmed tables are already booked for this time.</p><FloorplanPicker floorplan={floorplan} floors={floors} activeFloorId={activeFloor?.id || ""} selected={draft.seatingOption} onFloorChange={(floorId) => setDraft((current) => ({ ...current, floorId, seatingOption: null }))} onSelect={(floorId, option) => setDraft((current) => ({ ...current, floorId: floorId || current.floorId, seatingOption: option }))} />{!loading && !activeFloor?.tables.length ? <p className="wl-empty">No tables remain on this floor for the selected time.</p> : null}</div>
          ) : null}
          {draft.step === 4 ? (
            <div><span className="wl-kicker">Step 4</span><h2>Review your reservation</h2><div className="wl-review-card"><div><span>Location</span><strong>{branchShortName(branch)}</strong></div><div><span>Date &amp; time</span><strong>{formatDate(draft.reservationDate, branch.timezone)} · {formatTime(draft.reservationTimeLocal)}</strong></div><div><span>Party</span><strong>{draft.partySize} guests · {draft.durationMinutes} min</strong></div><div><span>Table</span><strong>{features.tableSelection ? `${draft.seatingOption?.name} · ${floors.find((floor) => floor.id === draft.floorId)?.name}` : "Assigned when you arrive"}</strong></div></div><label className="wl-request-field">Special requests <span>Optional</span><textarea disabled={Boolean(reservation)} maxLength={500} value={draft.specialRequest} onChange={(event) => setDraft((current) => ({ ...current, specialRequest: event.target.value }))} placeholder="Allergies, celebrations, accessibility or seating needs…" /></label><div className="wl-policy-confirm"><strong>{formatMoney(policy?.depositAmount || 0, policy?.depositCurrency || tenant.currency)} deposit due now</strong><p>Free cancellation up to {policy?.freeCancelWindowHours ?? 0} hours before your booking. Tables are held for {policy?.gracePeriodMinutes ?? 0} minutes after the reservation time.</p></div>{requiresPayment ? <PaymentMethodSelector value={draft.paymentMethod ?? null} disabled={Boolean(reservation)} onChange={(paymentMethod: PaymentMethod) => setDraft((current) => ({ ...current, paymentMethod }))} /> : null}{!isAuthenticated ? <p className="wl-auth-note">You’ll sign in or create an account next. Your choices are saved.</p> : null}</div>
          ) : null}
          <div className="wl-booking-actions">{draft.step > 1 && !reservation ? <button className="wl-button wl-button-ghost" type="button" onClick={() => goToStep(-1)}>Back</button> : <span />}{draft.step < 4 ? <button className="wl-button" type="button" disabled={loading || (draft.step === 1 && !draft.branchId) || (draft.step === 2 && !draft.reservationTimeLocal) || (draft.step === 3 && !draft.seatingOption)} onClick={() => goToStep(1)}>Continue</button> : <button className="wl-button" type="button" disabled={loading || (features.tableSelection && !draft.seatingOption) || (requiresPayment && !draft.paymentMethod && !(payment && reservation))} onClick={() => payment && reservation ? setPaymentOpen(true) : void submitReservation()}>{loading ? "Securing table…" : payment && reservation ? "Resume secure payment" : isAuthenticated ? draft.paymentMethod === "APPLE_PAY" ? "Continue with Apple Pay" : "Pay deposit & confirm" : "Sign in to confirm"}</button>}</div>
</ReservationFrame>

      {paymentOpen && payment && reservation ? <PaymentModal paymentId={payment.paymentId} provider={payment.provider} checkoutUrl={payment.checkoutUrl} clientSecret={payment.clientSecret} publishableKey={payment.publishableKey} connectedAccountId={payment.connectedAccountId} reservation={reservation} onSuccess={finishReservation} onClose={() => setPaymentOpen(false)} /> : null}
    </>
  );
}
