import { useMedia } from "./media";
import {
  Fragment,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import useTenant from "../hooks/useTenant";
import { usePresentation } from "./presentation";
import { useFeatures } from "./features";
import {
  safeUrl,
  typographyStacks,
  type WebsiteConfigV1,
  type RestaurantBranchDetail,
} from "./contract";
import {
  branchShortName,
  DAY_NAMES,
  formatMoney,
  formatTime,
} from "../white-label/format";
import {
  ReservationFrame,
  ReservationLocations,
} from "./reservation-presentation";
import "./website.css";

export function Selectable({
  id,
  children,
  className = "",
  style,
  as: Tag = "section",
  ...rest
}: {
  as?: "section" | "header" | "footer" | "div";
  id: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
} & Record<string, unknown>) {
  const p = usePresentation();
  return (
    <Tag
      {...rest}
      data-website-section={id}
      className={`${className} ${p.preview ? "ws-selectable" : ""} ${p.preview && p.selection === id ? "ws-selected" : ""}`}
      style={style}
      tabIndex={p.preview ? 0 : undefined}
      aria-label={p.preview ? `Select ${id}` : undefined}
      onKeyDown={
        p.preview
          ? (e: React.KeyboardEvent) => {
              if (
                e.target === e.currentTarget &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                p.select(id);
              }
            }
          : undefined
      }
      onClickCapture={
        p.preview
          ? (e: React.MouseEvent) => {
              if ((e.target as HTMLElement).closest("[data-preview-control]"))
                return;
              e.preventDefault();
              e.stopPropagation();
              p.select(id);
            }
          : undefined
      }
    >
      {children}
    </Tag>
  );
}

function Photo({
  src,
  style,
  className,
  alt = "",
}: {
  src?: string | null;
  style?: CSSProperties;
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState("");
  return src && safeUrl(src) && failed !== src ? (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(src)}
    />
  ) : (
    <div
      className={`ws-photo-placeholder ${className || ""}`}
      role="img"
      aria-label="Restaurant image unavailable"
      style={style}
    />
  );
}

/**
 * The original design pairs a kicker + heading on the left with an optional
 * action link on the right. Blank copy fields are dropped rather than rendered
 * as empty elements, so a freshly seeded draft never shows hollow gaps.
 */
function SectionHeading({
  value,
  action,
}: {
  value: { eyebrow?: string; heading: string; description?: string };
  action?: ReactNode;
}) {
  return (
    <div className="wl-section-heading">
      <div>
        {value.eyebrow ? (
          <span className="wl-kicker">{value.eyebrow}</span>
        ) : null}
        <h2>{value.heading}</h2>
      </div>
      {action}
    </div>
  );
}

function Action({
  value,
  className = "wl-button",
}: {
  value: { label: string; destination: string };
  className?: string;
}) {
  const { tenantSlug } = useTenant();
  const features = useFeatures();
  // An author can aim a button at any page, so a button aimed at a switched-off
  // one is dropped rather than left pointing somewhere that redirects away.
  if (value.destination === "menu" && !features.menu) return null;
  if (value.destination === "reserve" && !features.reservations) return null;
  return (
    <Link
      className={className}
      to={`/${encodeURIComponent(tenantSlug)}${value.destination === "home" ? "" : "/" + value.destination}`}
    >
      {value.label}
    </Link>
  );
}

/** A home-page location card, matching `.wl-location-card` from the original. */
function LocationCard({
  branch,
  display,
  ratio = "landscape",
}: {
  branch: RestaurantBranchDetail;
  display: WebsiteConfigV1["pages"]["locations"]["display"];
  ratio?: string;
}) {
  const { tenantSlug } = useTenant();
  const path = `/${encodeURIComponent(tenantSlug)}`;
  const height =
    ratio === "square"
      ? "clamp(300px, 34vw, 430px)"
      : ratio === "portrait"
        ? "clamp(340px, 40vw, 520px)"
        : "clamp(260px, 30vw, 430px)";
  return (
    <article className="wl-location-card ws-branch">
      <Photo
        src={branch.coverImageUrl || branch.photos[0]?.url}
        alt={`${branch.name} dining room`}
        style={{ height }}
      />
      <div className="wl-location-card-copy">
        <div className="wl-card-meta">
          {display.openStatus ? (
            <span className={branch.isOpen ? "is-open" : ""}>
              {branch.isOpen ? "Open now" : "Currently closed"}
            </span>
          ) : null}
          {display.cuisine && branch.cuisineName ? (
            <span>{branch.cuisineName}</span>
          ) : null}
        </div>
        <h3>{branchShortName(branch)}</h3>
        {display.address ? <p>{branch.addressSummary}</p> : null}
        {display.phone && branch.phone ? <p>{branch.phone}</p> : null}
        {display.email && branch.email ? <p>{branch.email}</p> : null}
        {display.hours ? (
          <div className="wl-hours">
            {branch.hours.map((h) => (
              <div key={h.dayOfWeek}>
                <span>{DAY_NAMES[h.dayOfWeek]}</span>
                <strong>
                  {h.isClosed
                    ? "Closed"
                    : `${formatTime(h.openTime)} – ${formatTime(h.closeTime)}`}
                </strong>
              </div>
            ))}
          </div>
        ) : null}
        {display.amenities && branch.amenities.length ? (
          <p>{branch.amenities.map((a) => a.name).join(" · ")}</p>
        ) : null}
        {display.policies ? (
          <p className="wl-deposit-note">
            Reservations require a{" "}
            {formatMoney(
              branch.policies.depositAmount,
              branch.policies.depositCurrency,
            )}{" "}
            deposit per booking.
          </p>
        ) : null}
        <div className="wl-card-actions">
          <Link className="wl-text-link" to={`${path}/locations?branch=${branch.id}`}>
            Details
          </Link>
          {display.reserve ? (
            <Link
              className="wl-button wl-button-outline wl-button-small"
              to={`${path}/reserve?branch=${branch.id}`}
            >
              Reserve
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** The full location detail panel used by the Locations page. */
function LocationDetail({
  branch,
  display,
}: {
  branch: RestaurantBranchDetail;
  display: WebsiteConfigV1["pages"]["locations"]["display"];
}) {
  const { tenantSlug } = useTenant();
  return (
    <section className="wl-location-detail ws-branch">
      <div className="wl-location-photo">
        <Photo
          src={branch.photos[0]?.url || branch.coverImageUrl}
          alt={`${branch.name} restaurant`}
        />
        {display.openStatus ? (
          <span className={branch.isOpen ? "is-open" : ""}>
            {branch.isOpen ? "Open now" : "Currently closed"}
          </span>
        ) : null}
      </div>
      <div className="wl-location-copy">
        {display.cuisine && branch.cuisineName ? (
          <span className="wl-kicker">{branch.cuisineName}</span>
        ) : null}
        <h2>{branchShortName(branch)}</h2>
        {display.address ? (
          <p className="wl-lead">{branch.addressSummary}</p>
        ) : null}
        {branch.about ? <p>{branch.about}</p> : null}
        {display.phone || display.email ? (
          <div className="wl-contact-list">
            {display.phone && branch.phone ? (
              <a href={`tel:${branch.phone}`}>{branch.phone}</a>
            ) : null}
            {display.email && branch.email ? (
              <a href={`mailto:${branch.email}`}>{branch.email}</a>
            ) : null}
          </div>
        ) : null}
        {display.hours ? (
          <div className="wl-hours">
            <h3>Opening hours</h3>
            {branch.hours.map((hour) => (
              <div key={hour.dayOfWeek}>
                <span>{DAY_NAMES[hour.dayOfWeek]}</span>
                <strong>
                  {hour.isClosed
                    ? "Closed"
                    : `${formatTime(hour.openTime)} – ${formatTime(hour.closeTime)}`}
                </strong>
              </div>
            ))}
          </div>
        ) : null}
        {display.amenities && branch.amenities.length ? (
          <p>{branch.amenities.map((a) => a.name).join(" · ")}</p>
        ) : null}
        {display.policies ? (
          <p className="wl-deposit-note">
            Reservations require a{" "}
            {formatMoney(
              branch.policies.depositAmount,
              branch.policies.depositCurrency,
            )}{" "}
            deposit per booking.
          </p>
        ) : null}
        {display.reserve ? (
          <Link
            className="wl-button"
            to={`/${encodeURIComponent(tenantSlug)}/reserve?branch=${branch.id}`}
          >
            Reserve at {branchShortName(branch)}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

/** The numbered three-dish teaser from the original home page. */
function MenuPreview() {
  const { menu, tenant, tenantSlug } = useTenant();
  const featured = (menu?.sections ?? [])
    .flatMap((s) => s.items)
    .filter((i) => i.available)
    .slice(0, 3);
  if (!menu || !featured.length) return null;
  return (
    <Selectable id="menu" className="wl-section ws-section">
      <div className="wl-section-heading">
        <div>
          <span className="wl-kicker">From the menu</span>
          <h2>A few of our dishes.</h2>
        </div>
        <p className="wl-caption">Prices and availability may change</p>
      </div>
      <div className="wl-menu-preview">
        {featured.map((item, index) => (
          <article key={`${item.name}-${index}`}>
            <span>0{index + 1}</span>
            <div>
              <h3>{item.name}</h3>
              {item.description ? <p>{item.description}</p> : null}
            </div>
            <strong>
              {item.price === null
                ? ""
                : formatMoney(item.price, menu.currency || tenant?.currency)}
            </strong>
          </article>
        ))}
      </div>
      <Link
        className="wl-button wl-button-dark"
        to={`/${encodeURIComponent(tenantSlug)}/menu`}
      >
        View the menu
      </Link>
    </Selectable>
  );
}

function Home() {
  const { config: c, preview } = usePresentation();
  const { branches, tenant, tenantSlug } = useTenant();
  const media = useMedia();
  if (!c) return null;
  const h = c.pages.home;
  const f = c.features;
  const path = `/${encodeURIComponent(tenantSlug)}`;
  const locationCount = branches.length;
  const locationLabel = `${locationCount} ${locationCount === 1 ? "location" : "locations"}`;

  // The original hero shows the primary branch's cuisine as its kicker. That is
  // connected data, so it is a fallback for an unauthored eyebrow rather than a
  // seeded default.
  const heroEyebrow = h.hero.eyebrow || branches[0]?.cuisineName || "";

  const hero = () => {
    const image = media(h.hero.image);
    // The original hero is a left-weighted scrim over the photo. `overlay`
    // scales that scrim so the control keeps meaning, and focalX/focalY still
    // drive the crop.
    const strength = h.hero.overlay / 100;
    const scrim = `linear-gradient(90deg, rgba(12,10,8,${(0.76 * strength * 2.2).toFixed(3)}), rgba(12,10,8,${(0.12 * strength * 2.2).toFixed(3)}))`;
    return (
      <Selectable
        id="home.hero"
        className={`wl-hero ws-hero ws-hero-${h.hero.variant}`}
        data-alignment={h.hero.alignment}
        style={{
          backgroundImage: image ? `${scrim}, url("${image}")` : scrim,
          backgroundPosition: `${h.hero.focalX}% ${h.hero.focalY}%`,
        }}
      >
        {h.hero.variant === "split" ? (
          <Photo
            className="ws-hero-photo"
            src={image}
            style={{ objectPosition: `${h.hero.focalX}% ${h.hero.focalY}%` }}
          />
        ) : null}
        <div className="wl-hero-copy">
          {heroEyebrow ? (
            <span className="wl-kicker wl-kicker-light">{heroEyebrow}</span>
          ) : null}
          <h1>{h.hero.heading}</h1>
          {h.hero.description ? <p>{h.hero.description}</p> : null}
          <div className="wl-actions ws-actions">
            <Action value={h.hero.primary} />
            <Action
              value={h.hero.secondary}
              className="wl-text-link wl-text-link-light"
            />
          </div>
        </div>
        {locationCount ? (
          <div className="wl-hero-note">
            <span>Open for reservations</span>
            <strong>{locationLabel}</strong>
          </div>
        ) : null}
      </Selectable>
    );
  };

  const story = () => {
    const body = h.story.body || tenant?.about || "";
    const image = media(h.story.image);
    return (
      <Selectable
        id="home.story"
        className={`wl-section wl-intro-grid ws-section ws-story ws-story-${h.story.variant}`}
      >
        <div>
          {h.story.eyebrow ? (
            <span className="wl-kicker">{h.story.eyebrow}</span>
          ) : null}
          <h2>{h.story.heading}</h2>
          {h.story.variant === "image-left" && image ? (
            <Photo className="ws-story-photo" src={image} alt="" />
          ) : null}
        </div>
        <div>
          {/* `description` is the lead paragraph; `body` only adds a second
              paragraph when it says something different. Seeding both from the
              restaurant's About would otherwise print it twice. */}
          {h.story.description ? (
            <p className="wl-lead">{h.story.description}</p>
          ) : null}
          {body && body !== h.story.description ? (
            <p className={h.story.description ? "" : "wl-lead"}>{body}</p>
          ) : null}
          {h.story.variant === "image-right" && image ? (
            <Photo className="ws-story-photo" src={image} alt="" />
          ) : null}
          <Link className="wl-text-link" to={`${path}/about`}>
            Discover our story <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Selectable>
    );
  };

  const locations = () => (
    <Selectable
      id="home.locations"
      className={`wl-section wl-section-paper ws-section ws-locations-${h.locations.variant}`}
    >
      <SectionHeading
        value={h.locations}
        action={
          <Link className="wl-text-link" to={`${path}/locations`}>
            View all locations <span aria-hidden="true">→</span>
          </Link>
        }
      />
      <div className="wl-location-grid ws-grid">
        {branches.map((b) => (
          <LocationCard
            key={b.id}
            branch={b}
            display={{
              ...h.locations.display,
              reserve: h.locations.display.reserve && f.reservations,
            }}
            ratio={h.locations.imageRatio}
          />
        ))}
      </div>
      {!branches.length && <p>No locations added yet.</p>}
    </Selectable>
  );

  const gallery = () => {
    const images = h.gallery.images
      .map((r) => media(r))
      .filter((url): url is string => Boolean(url));
    // Six unset slots would otherwise render as six grey placeholders on a
    // freshly created draft. The published site drops the section entirely;
    // the editor keeps it so it stays selectable while photos are being added.
    if (!images.length && !preview) return null;
    return (
      <Selectable
        id="home.gallery"
        className={`wl-gallery ws-gallery ws-gallery-${h.gallery.variant}`}
        aria-label="Restaurant gallery"
      >
        {(images.length ? images : [null, null, null]).map((url, i) => (
          <Photo
            key={i}
            src={url}
            alt={`${tenant?.name ?? ""} atmosphere ${i + 1}`}
          />
        ))}
      </Selectable>
    );
  };

  const cta = () => {
    const image = media(h.cta.image);
    return (
      <Selectable
        id="home.cta"
        className={`wl-reserve-banner ws-cta ws-background-${h.cta.background}`}
        style={
          h.cta.background === "image" && image
            ? {
                backgroundImage: `linear-gradient(#0006,#0006),url("${image}")`,
              }
            : undefined
        }
      >
        {h.cta.eyebrow ? (
          <span className="wl-kicker wl-kicker-light">{h.cta.eyebrow}</span>
        ) : null}
        <h2>{h.cta.heading}</h2>
        {h.cta.description ? <p>{h.cta.description}</p> : null}
        <Action value={h.cta.action} className="wl-button wl-button-light" />
      </Selectable>
    );
  };

  const render = { hero, story, locations, gallery, cta };
  // The closing banner exists to send guests to the booking flow, so it goes
  // when reservations do — its `visible` flag is locked on and cannot say so.
  const hidden = (id: keyof typeof render) =>
    id === "cta" && !f.reservations;

  return (
    <>
      {c.homeOrder.map((id) => (
        <Fragment key={id}>
          {h[id].visible && !hidden(id) ? render[id]() : null}
          {id === "locations" && f.menu && <MenuPreview />}
        </Fragment>
      ))}
    </>
  );
}

function Content({ page }: { page: string }) {
  const [query, setQuery] = useSearchParams();
  const { config: c, branchId, preview } = usePresentation();
  const { tenant, branches, menu, tenantSlug } = useTenant();
  const media = useMedia();
  const [chosen, setChosen] = useState("");
  if (!c) return null;
  const f = c.features;
  const path = `/${encodeURIComponent(tenantSlug)}`;
  const selected =
    branches.find(
      (b) =>
        b.id ===
        (branchId ||
          chosen ||
          query.get("branch") ||
          c.pages.locations.defaultBranchId),
    ) || branches[0];
  const pickBranch = (id: string) => {
    // In the builder iframe the URL is owned by the preview host, so selection
    // is kept in local state instead.
    setChosen(id);
    if (!preview) setQuery({ branch: id });
  };

  if (page === "home") return <Home />;

  if (page === "about") {
    const a = c.pages.about;
    const story = a.storyBody ?? tenant?.about ?? "";
    const values = a.values.filter((v) => v.title || v.description);
    return (
      <Selectable id="about" className="wl-page ws-section" as="div">
        <header className="wl-page-hero">
          {a.eyebrow || branches[0]?.cuisineName ? (
            <span className="wl-kicker">
              {a.eyebrow || branches[0]?.cuisineName}
            </span>
          ) : null}
          <h1>{a.heading}</h1>
          {a.description ? <p>{a.description}</p> : null}
        </header>
        <section className="wl-about-story ws-story">
          <div className="wl-about-image">
            <Photo src={media(a.image)} alt={`Inside ${tenant?.name ?? ""}`} />
          </div>
          <div>
            <span className="wl-kicker">Our story</span>
            <h2>{a.storyTitle}</h2>
            {story ? <p className="wl-lead">{story}</p> : null}
            {f.reservations ? (
              <Link className="wl-button wl-button-dark" to={`${path}/reserve`}>
                Reserve your table
              </Link>
            ) : null}
          </div>
        </section>
        {values.length ? (
          <section className="wl-values ws-grid">
            {values.map((v, i) => (
              <article key={i}>
                <span>0{i + 1}</span>
                <h3>{v.title}</h3>
                <p>{v.description}</p>
              </article>
            ))}
          </section>
        ) : null}
      </Selectable>
    );
  }

  if (page === "locations") {
    const l = c.pages.locations;
    return (
      <Selectable id="locations" className="wl-page ws-section" as="div">
        <header className="wl-page-hero">
          {l.eyebrow ? <span className="wl-kicker">{l.eyebrow}</span> : null}
          <h1>{l.heading}</h1>
          {l.description ? <p>{l.description}</p> : null}
        </header>
        {!selected ? (
          <p className="wl-section">No locations added yet.</p>
        ) : (
          <>
            <div
              className="wl-location-tabs"
              role="tablist"
              aria-label="Restaurant branches"
            >
              {branches.map((b) => (
                <button
                  key={b.id}
                  role="tab"
                  type="button"
                  data-preview-control
                  aria-selected={selected.id === b.id}
                  className={selected.id === b.id ? "is-active" : ""}
                  onClick={() => pickBranch(b.id)}
                >
                  {branchShortName(b)}
                </button>
              ))}
            </div>
            <LocationDetail
              branch={selected}
              display={{
                ...l.display,
                reserve: l.display.reserve && f.reservations,
              }}
            />
          </>
        )}
      </Selectable>
    );
  }

  if (page === "policies") {
    const p = c.pages.policies;
    const policy = selected?.policies;
    const cards: Array<[string, string, string]> = [];
    if (policy) {
      // Party size and reservation length have no toggle in the schema and are
      // always shown, matching the original page's six-card grid.
      cards.push([
        "Party size",
        `${policy.minPartySize ?? 1}–${policy.maxPartySize ?? 20} guests`,
        "For larger groups, contact the restaurant directly.",
      ]);
      cards.push([
        "Reservation length",
        `${policy.minReservationDurationMinutes ?? 60}–${policy.maxReservationDurationMinutes ?? 90} minutes`,
        `A ${policy.turnTimeMinutes ?? 0}-minute reset is kept between tables.`,
      ]);
      if (p.deposit)
        cards.push([
          "Deposit",
          formatMoney(policy.depositAmount, policy.depositCurrency),
          "Your deposit is applied according to the restaurant’s reservation terms.",
        ]);
      if (p.cancellation)
        cards.push([
          "Free cancellation",
          `${policy.freeCancelWindowHours ?? 0} hours before`,
          "Late cancellations may not qualify for a refund.",
        ]);
      if (p.gracePeriod)
        cards.push([
          "Arrival grace",
          `${policy.gracePeriodMinutes ?? 0} minutes`,
          "Please contact the branch if you expect to arrive late.",
        ]);
      if (p.bookingWindow)
        cards.push([
          "Booking cutoff",
          `${policy.bookingCutoffHours ?? 0} hours`,
          "Last-minute availability is reflected in the live booking calendar.",
        ]);
    }
    return (
      <Selectable id="policies" className="wl-page ws-section" as="div">
        <header className="wl-page-hero">
          <span className="wl-kicker">Before you book</span>
          <h1>{p.heading}</h1>
          {p.introduction ? <p>{p.introduction}</p> : null}
        </header>
        {!selected ? (
          <p className="wl-section">No locations added yet.</p>
        ) : (
          <>
            <label className="wl-branch-select">
              Policies for
              <select
                data-preview-control
                value={selected.id}
                onChange={(e) => pickBranch(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {branchShortName(b)}
                  </option>
                ))}
              </select>
            </label>
            <section className="wl-policy-grid ws-grid">
              {cards.map(([title, value, copy]) => (
                <article key={title}>
                  <span className="wl-kicker">{title}</span>
                  <h2>{value}</h2>
                  <p>{copy}</p>
                </article>
              ))}
            </section>
            <section className="wl-policy-note">
              <h2>Good to know</h2>
              <p>
                Availability, deposits, and refund eligibility are calculated by
                the restaurant’s live reservation system when you book. The
                values above come directly from {branchShortName(selected)}’s
                current settings.
              </p>
            </section>
          </>
        )}
      </Selectable>
    );
  }

  if (page === "reserve")
    return (
      <Selectable id="reserve" className="ws-reserve">
        <ReservationFrame
          step={1}
          summary={
            selected ? (
              <>
                <Photo
                  src={selected.coverImageUrl || selected.photos[0]?.url}
                />
                <h2>{branchShortName(selected)}</h2>
                <p>{selected.addressSummary}</p>
                <p>Choose a date, time and table.</p>
              </>
            ) : (
              <p>No locations added yet.</p>
            )
          }
        >
          <fieldset disabled>
            <ReservationLocations
              branches={branches}
              branchId={selected?.id || ""}
              chooseBranch={() => {}}
            />
            <div className="wl-booking-actions">
              <button className="wl-button" disabled>
                Continue
              </button>
            </div>
          </fieldset>
          <p>Design preview — booking controls are locked.</p>
        </ReservationFrame>
      </Selectable>
    );

  return (
    <Selectable id="menu" className="wl-page ws-section" as="div">
      <header className="wl-page-hero wl-page-hero-menu">
        <span className="wl-kicker">From our kitchen</span>
        <h1>The menu</h1>
      </header>
      {!menu || !menu.sections.length ? (
        <p className="wl-section">No menu is published yet.</p>
      ) : (
        <>
          <nav className="wl-menu-index" aria-label="Menu sections">
            {menu.sections.map((s) => (
              <a key={s.anchor} href={`#${s.anchor}`}>
                {s.name}
              </a>
            ))}
          </nav>
          <div className="wl-menu-sections">
            {menu.sections.map((s) => (
              <section id={s.anchor} className="wl-menu-section" key={s.anchor}>
                <div>
                  {s.eyebrow ? (
                    <span className="wl-kicker">{s.eyebrow}</span>
                  ) : null}
                  <h2>{s.name}</h2>
                </div>
                <div className="wl-menu-list">
                  {s.items.map((item, n) => (
                    <article
                      key={`${s.anchor}-${n}`}
                      className={item.imageUrl ? "has-image" : undefined}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" loading="lazy" />
                      ) : null}
                      <div>
                        <h3>{item.name}</h3>
                        {item.description ? <p>{item.description}</p> : null}
                        {item.tags.map((tag) => (
                          <span className="wl-tag" key={tag}>
                            {tag}
                          </span>
                        ))}
                        {item.available ? null : (
                          <span className="wl-tag">Unavailable</span>
                        )}
                      </div>
                      {item.price === null ? null : (
                        <strong>{formatMoney(item.price, menu.currency)}</strong>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </Selectable>
  );
}

const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
} as const;

export function StudioSite({
  page,
  children,
}: {
  page: string;
  children?: ReactNode;
}) {
  const p = usePresentation();
  const { tenant, tenantSlug, menu } = useTenant();
  const media = useMedia();
  const [open, setOpen] = useState(false);
  const c = p.config;
  if (!c || !tenant) return null;
  const t = c.theme;
  const fonts = typographyStacks[t.typography];
  const path = (id: string) =>
    `/${encodeURIComponent(tenantSlug)}${id === "home" ? "" : "/" + id}`;
  const current = page || "home";
  const style = {
    "--wl-accent": t.primaryColor,
    "--wl-accent-dark": t.accentDark,
    "--wl-ink": t.textColor,
    "--wl-paper": t.backgroundColor,
    "--ws-heading": fonts.heading,
    "--ws-body": fonts.body,
    "--ws-weight": fonts.weight,
    "--ws-heading-scale": t.headingScale,
    "--ws-space":
      t.spacing === "compact"
        ? "40px"
        : t.spacing === "generous"
          ? "100px"
          : "70px",
    "--ws-radius":
      t.buttonShape === "pill"
        ? "999px"
        : t.buttonShape === "rounded"
          ? "10px"
          : "0",
    "--ws-button-pad":
      t.buttonSize === "compact"
        ? "9px 16px"
        : t.buttonSize === "large"
          ? "19px 32px"
          : "14px 24px",
  } as CSSProperties;
  return (
    <div className={`wl-site ws-site ws-buttons-${t.buttonFill}`} style={style}>
      <a className="wl-skip-link" href="#main-content">
        Skip to content
      </a>
      <Selectable
        id="header"
        as="header"
        className={`wl-header ws-header-${c.header.variant}`}
        style={{ position: c.header.sticky ? "sticky" : "relative" }}
      >
        <Link
          className="wl-wordmark"
          to={path("home")}
          aria-label={`${tenant.name} home`}
        >
          {c.brand.logoDisplay !== "name-only" && (
            <Photo
              className="wl-wordmark-logo"
              src={media(c.brand.logo)}
              style={{ width: c.brand.logoSize, height: c.brand.logoSize }}
            />
          )}
          {c.brand.logoDisplay !== "logo-only" && (
            <span className="wl-wordmark-main">
              {c.brand.shortName || tenant.name}
              {c.brand.tagline ? <small>{c.brand.tagline}</small> : null}
            </span>
          )}
        </Link>
        <button
          className="wl-menu-button"
          data-preview-control
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`wl-nav ${open ? "is-open" : ""}`} aria-label="Primary">
          {Object.entries(c.header.navigation)
            .filter(
              ([id, n]) =>
                n.visible &&
                id !== "reserve" &&
                (id !== "menu" || (menu && c.features.menu)),
            )
            .map(([id, n]) => (
              <Link
                key={id}
                to={path(id)}
                className={current === id ? "is-active" : undefined}
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
          {c.features.reservations ? (
            <Link
              className="wl-button wl-button-small"
              to={path("reserve")}
              onClick={() => setOpen(false)}
            >
              {c.header.reservationLabel}
            </Link>
          ) : null}
        </nav>
      </Selectable>
      <main id="main-content">{children || <Content page={page} />}</main>
      <Selectable id="footer" as="footer" className="wl-footer">
        <div>
          <div className="wl-wordmark wl-wordmark-footer">
            {c.footer.showLogo && (
              <Photo
                className="wl-wordmark-logo"
                src={media(c.brand.logo)}
                style={{ width: c.brand.logoSize, height: c.brand.logoSize }}
              />
            )}
            <span className="wl-wordmark-main">
              {c.brand.shortName || tenant.name}
            </span>
          </div>
          {c.footer.showDescription && (c.footer.description || tenant.about) ? (
            <p>{c.footer.description || tenant.about}</p>
          ) : null}
        </div>
        <div className="wl-footer-links">
          {c.footer.menuLink && menu && c.features.menu && (
            <Link to={path("menu")}>Menu</Link>
          )}
          {c.footer.locationsLink && (
            <Link to={path("locations")}>Locations</Link>
          )}
          {c.footer.policiesLink && (
            <Link to={path("policies")}>Reservation policies</Link>
          )}
          {c.features.reservations && (
            <Link to={path("reserve")}>Book a table</Link>
          )}
          {(["instagram", "facebook", "tiktok"] as const).map((id) =>
            c.footer[id] && safeUrl(c.footer[id]) ? (
              <a key={id} href={c.footer[id]} rel="noreferrer">
                {SOCIAL_LABELS[id]}
              </a>
            ) : null,
          )}
        </div>
        {c.footer.attribution && (
          <p className="wl-powered">
            Reservations powered by <strong>Tavlo</strong>
          </p>
        )}
      </Selectable>
    </div>
  );
}
