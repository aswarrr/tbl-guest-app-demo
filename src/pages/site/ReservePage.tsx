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
import type { AvailableFloor, CustomerReservation, PaymentMethod, ReservationDraft } from "../../white-label/types";

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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingPaymentKey = `tbl.pending-payment:${tenantSlug}`;
  const pendingPayment = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(pendingPaymentKey) || "null") as { paymentId: string; checkoutUrl: string; reservation: CustomerReservation } | null;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reservation, setReservation] = useState<CustomerReservation | null>(pendingPayment?.reservation || null);
  const [payment, setPayment] = useState<{ paymentId: string; checkoutUrl: string } | null>(pendingPayment ? { paymentId: pendingPayment.paymentId, checkoutUrl: pendingPayment.checkoutUrl } : null);
  const [paymentOpen, setPaymentOpen] = useState(Boolean(pendingPayment));

  const branch = branches.find((item) => item.id === draft.branchId) || branches[0];
  const policy = branch?.policies;
  const requiresPayment = Boolean(policy?.depositRequired && (policy.depositAmount || 0) > 0);
  const activeFloor = floors.find((floor) => floor.id === draft.floorId) || floors[0];
  const partySizes = useMemo(() => Array.from({ length: Math.max(1, (policy?.maxPartySize || 20) - (policy?.minPartySize || 1) + 1) }, (_, index) => (policy?.minPartySize || 1) + index), [policy?.maxPartySize, policy?.minPartySize]);
  const durations = useMemo(() => {
    const min = policy?.minReservationDurationMinutes || 60;
    const max = policy?.maxReservationDurationMinutes || 90;
    const values = [];
    for (let value = min; value <= max; value += 30) values.push(value);
    return values;
  }, [policy?.maxReservationDurationMinutes, policy?.minReservationDurationMinutes]);

  useEffect(() => saveReservationDraft(tenantSlug, draft), [draft, tenantSlug]);

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

  useEffect(() => {
    if (draft.step < 3 || !draft.reservationTimeLocal) return;
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
  }, [draft.branchId, draft.durationMinutes, draft.partySize, draft.reservationDate, draft.reservationTimeLocal, draft.step]);

  const updateDiningDetails = (changes: Partial<ReservationDraft>) => {
    setDraft((current) => ({ ...current, ...changes, reservationTimeLocal: "", floorId: "", seatingOption: null }));
  };

  const chooseBranch = (branchId: string) => {
    const selected = branches.find((item) => item.id === branchId);
    if (!selected) return;
    setDraft((current) => ({ ...current, branchId, partySize: Math.max(2, selected.policies.minPartySize || 1), reservationDate: branchLocalDate(selected.timezone), durationMinutes: Math.max(60, selected.policies.minReservationDurationMinutes || 60), reservationTimeLocal: "", floorId: "", seatingOption: null }));
  };

  const finishReservation = useCallback((confirmed: CustomerReservation) => {
    sessionStorage.setItem(`tbl.confirmation:${confirmed.id}`, JSON.stringify(confirmed));
    sessionStorage.removeItem(pendingPaymentKey);
    clearReservationDraft(tenantSlug);
    setPaymentOpen(false);
    setPayment(null);
    navigate(`${tenantPath("reservation")}/${confirmed.id}/confirmation`, { state: { reservation: confirmed } });
  }, [navigate, pendingPaymentKey, tenantSlug, tenantPath]);

  const submitReservation = async () => {
    if (!draft.seatingOption || !branch) return;
    if (!isAuthenticated) {
      saveReservationDraft(tenantSlug, { ...draft, step: 4 });
      navigate(`${tenantPath("auth/login")}?returnTo=${encodeURIComponent(`${tenantPath("reserve")}?resume=review`)}`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const latest = await customerService.getFloorsAvailability(branch.id, { date: draft.reservationDate, partySize: draft.partySize, durationMinutes: draft.durationMinutes, time: draft.reservationTimeLocal });
      const stillAvailable = latest.floors.flatMap((floor) => floor.tables).find((option) => option.id === draft.seatingOption?.id && sameTableIds(option.tableIds, draft.seatingOption.tableIds));
      if (!stillAvailable) {
        setFloors(latest.floors);
        setDraft((current) => ({ ...current, step: 3, floorId: latest.floors[0]?.id || "", seatingOption: null }));
        throw new Error("That table was just taken. Please choose another available table.");
      }

      const hold = await customerService.createHold(branch.id, {
        partySize: draft.partySize,
        reservationDate: draft.reservationDate,
        reservationTimeLocal: draft.reservationTimeLocal,
        durationMinutes: draft.durationMinutes,
        tableIds: stillAvailable.tableIds,
        specialRequest: draft.specialRequest.trim() || undefined,
      });
      setReservation(hold);

      if (hold.depositRequired && hold.depositAmount > 0) {
        const started = await customerService.startPayment(hold.id);
        setPayment({ paymentId: started.paymentId, checkoutUrl: started.checkoutUrl });
        sessionStorage.setItem(pendingPaymentKey, JSON.stringify({ paymentId: started.paymentId, checkoutUrl: started.checkoutUrl, reservation: hold }));
        setPaymentOpen(true);
      } else {
        finishReservation(await customerService.confirmReservation(hold.id));
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "We could not complete this reservation.");
    } finally {
      setLoading(false);
    }
  };

  if (!tenant || !branch) return null;


  return (
    <><ReservationFrame step={draft.step} summary={<><span className="wl-kicker">Your reservation</span><img src={branch.coverImageUrl || branch.photos[0]?.url} alt="" /><h2>{branchShortName(branch)}</h2><p>{branch.addressSummary}</p><dl><div><dt>Date</dt><dd>{formatDate(draft.reservationDate, branch.timezone)}</dd></div><div><dt>Time</dt><dd>{draft.reservationTimeLocal ? formatTime(draft.reservationTimeLocal) : "Choose a time"}</dd></div><div><dt>Guests</dt><dd>{draft.partySize}</dd></div><div><dt>Table</dt><dd>{draft.seatingOption?.name || "Choose a table"}</dd></div></dl>{reservation ? <div className="wl-hold-timer"><HoldCountdown expiresAt={reservation.holdExpiresAt} /></div> : null}</>}>
          {error ? <div className="wl-inline-error" role="alert">{error}</div> : null}
          {draft.step === 1 ? (
            <ReservationLocations branches={branches} branchId={draft.branchId} chooseBranch={chooseBranch}/>
          ) : null}
          {draft.step === 2 ? (
            <div><span className="wl-kicker">Step 2</span><h2>When are you joining us?</h2><div className="wl-field-grid"><label>Party size<select value={draft.partySize} onChange={(event) => updateDiningDetails({ partySize: Number(event.target.value) })}>{partySizes.map((size) => <option key={size} value={size}>{size} {size === 1 ? "guest" : "guests"}</option>)}</select></label><label>Date<input type="date" min={branchLocalDate(branch.timezone)} max={addDays(branchLocalDate(branch.timezone), 90)} value={draft.reservationDate} onChange={(event) => updateDiningDetails({ reservationDate: event.target.value })} /></label><label>Duration<select value={draft.durationMinutes} onChange={(event) => updateDiningDetails({ durationMinutes: Number(event.target.value) })}>{durations.map((duration) => <option value={duration} key={duration}>{duration < 60 ? `${duration} min` : `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ""}`}</option>)}</select></label></div><div className="wl-time-heading"><h3>Available times</h3>{loading ? <span>Checking…</span> : null}</div><div className="wl-time-grid">{times.map((time) => <button className={draft.reservationTimeLocal === time ? "is-selected" : ""} type="button" key={time} onClick={() => setDraft((current) => ({ ...current, reservationTimeLocal: time, floorId: "", seatingOption: null }))}>{formatTime(time)}</button>)}</div>{!loading && times.length === 0 ? <p className="wl-empty">No tables match these details. Try another date or duration.</p> : null}</div>
          ) : null}
          {draft.step === 3 ? (
            <div><span className="wl-kicker">Step 3</span><h2>Choose your table</h2><p className="wl-caption">This seating selector shows real available tables. Placement is illustrative; exact physical positions are not supplied by the guest API.</p><div className="wl-floor-tabs" role="tablist">{floors.map((floor) => <button type="button" role="tab" aria-selected={activeFloor?.id === floor.id} className={activeFloor?.id === floor.id ? "is-active" : ""} key={floor.id} onClick={() => setDraft((current) => ({ ...current, floorId: floor.id, seatingOption: null }))}>{floor.name}</button>)}</div><div className="wl-seat-map"><div className="wl-seat-map-label">Dining room · illustrative layout</div>{activeFloor?.tables.map((table) => <button type="button" className={`${table.type === "COMBO" ? "is-combo" : ""} ${draft.seatingOption?.id === table.id ? "is-selected" : ""}`} key={table.id} onClick={() => setDraft((current) => ({ ...current, floorId: activeFloor.id, seatingOption: table }))}><span className="wl-table-shape">{table.type === "COMBO" ? table.tableIds.length : ""}</span><strong>{table.name}</strong><small>{table.type === "COMBO" ? `${table.tableIds.length} joined tables` : "Available"}</small></button>)}</div>{!loading && !activeFloor?.tables.length ? <p className="wl-empty">No tables remain on this floor for the selected time.</p> : null}</div>
          ) : null}
          {draft.step === 4 ? (
            <div><span className="wl-kicker">Step 4</span><h2>Review your reservation</h2><div className="wl-review-card"><div><span>Location</span><strong>{branchShortName(branch)}</strong></div><div><span>Date &amp; time</span><strong>{formatDate(draft.reservationDate, branch.timezone)} · {formatTime(draft.reservationTimeLocal)}</strong></div><div><span>Party</span><strong>{draft.partySize} guests · {draft.durationMinutes} min</strong></div><div><span>Table</span><strong>{draft.seatingOption?.name} · {floors.find((floor) => floor.id === draft.floorId)?.name}</strong></div></div><label className="wl-request-field">Special requests <span>Optional</span><textarea disabled={Boolean(reservation)} maxLength={500} value={draft.specialRequest} onChange={(event) => setDraft((current) => ({ ...current, specialRequest: event.target.value }))} placeholder="Allergies, celebrations, accessibility or seating needs…" /></label><div className="wl-policy-confirm"><strong>{formatMoney(policy?.depositAmount || 0, policy?.depositCurrency || tenant.currency)} deposit due now</strong><p>Free cancellation up to {policy?.freeCancelWindowHours ?? 0} hours before your booking. Tables are held for {policy?.gracePeriodMinutes ?? 0} minutes after the reservation time.</p></div>{requiresPayment ? <PaymentMethodSelector value={draft.paymentMethod ?? null} disabled={Boolean(reservation)} onChange={(paymentMethod: PaymentMethod) => setDraft((current) => ({ ...current, paymentMethod }))} /> : null}{!isAuthenticated ? <p className="wl-auth-note">You’ll sign in or create an account next. Your choices are saved.</p> : null}</div>
          ) : null}
          <div className="wl-booking-actions">{draft.step > 1 && !reservation ? <button className="wl-button wl-button-ghost" type="button" onClick={() => setDraft((current) => ({ ...current, step: current.step - 1 }))}>Back</button> : <span />}{draft.step < 4 ? <button className="wl-button" type="button" disabled={loading || (draft.step === 1 && !draft.branchId) || (draft.step === 2 && !draft.reservationTimeLocal) || (draft.step === 3 && !draft.seatingOption)} onClick={() => setDraft((current) => ({ ...current, step: current.step + 1 }))}>Continue</button> : <button className="wl-button" type="button" disabled={loading || !draft.seatingOption || (requiresPayment && !draft.paymentMethod && !(payment && reservation))} onClick={() => payment && reservation ? setPaymentOpen(true) : void submitReservation()}>{loading ? "Securing table…" : payment && reservation ? "Resume secure payment" : isAuthenticated ? draft.paymentMethod === "APPLE_PAY" ? "Continue with Apple Pay" : "Pay deposit & confirm" : "Sign in to confirm"}</button>}</div>
</ReservationFrame>

      {paymentOpen && payment && reservation ? <PaymentModal paymentId={payment.paymentId} checkoutUrl={payment.checkoutUrl} reservation={reservation} onSuccess={finishReservation} onClose={() => setPaymentOpen(false)} /> : null}
    </>
  );
}
