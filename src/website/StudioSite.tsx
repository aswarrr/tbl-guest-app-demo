import { useMedia } from "./media";
import { contrastTextFor } from "./theme-contrast";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import useTenant from "../hooks/useTenant";
import { usePresentation } from "./presentation";
import {
  safeUrl,
  typographyStacks,
  type WebsiteConfigV1,
  type RestaurantBranchDetail,
} from "./contract";
import {
  ReservationFrame,
  ReservationLocations,
} from "./reservation-presentation";
import PoweredByTavlo from "../components/branding/PoweredByTavlo";
import "./website.css";

const socialLabels: Record<"instagram" | "facebook" | "tiktok", string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};
const socialIcons: Record<"instagram" | "facebook" | "tiktok", ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.5 8.5H13.8c-.5 0-1 .5-1 1.1v2h2.6l-.4 2.7h-2.2V21h-3v-6.7H7.5v-2.7h2.3V9.3c0-2.1 1.6-3.9 3.6-3.9h2.1v3.1Z"
      />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.5 3h2.2c.2 1.4 1.1 2.7 2.5 3.3.5.2 1 .3 1.5.3v2.3c-1.4 0-2.7-.4-3.9-1.2v6.2c0 3-2.4 5.4-5.4 5.4A5.4 5.4 0 0 1 6 13.9c0-2.9 2.3-5.3 5.1-5.4v2.4a3 3 0 0 0-2.6 3 3 3 0 0 0 3 3c1.7 0 3.1-1.3 3.1-3.1V3Z"
      />
    </svg>
  ),
};
export function Selectable({
  id,
  children,
  className = "",
  style,
  as: Tag = "section",
}: {
  as?: "section" | "header" | "footer";
  id: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const p = usePresentation();
  return (
    <Tag
      data-website-section={id}
      className={`${className} ${p.preview ? "ws-selectable" : ""} ${p.preview && p.selection === id ? "ws-selected" : ""}`}
      style={style}
      tabIndex={p.preview ? 0 : undefined}
      aria-label={p.preview ? `Select ${id}` : undefined}
      onKeyDown={
        p.preview
          ? (e) => {
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
          ? (e) => {
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
  className = "",
}: {
  src?: string | null;
  style?: CSSProperties;
  className?: string;
}) {
  const [failed, setFailed] = useState("");
  return src && safeUrl(src) && failed !== src ? (
    <img
      src={src}
      alt=""
      className={className}
      style={style}
      onError={() => setFailed(src)}
    />
  ) : (
    <div
      className={`ws-photo-placeholder ${className}`}
      role="img"
      aria-label="Restaurant image unavailable"
      style={style}
    />
  );
}
function Copy({
  value,
}: {
  value: { eyebrow?: string; heading: string; description?: string };
}) {
  return (
    <>
      {value.eyebrow ? <span className="wl-kicker">{value.eyebrow}</span> : null}
      <h1>{value.heading}</h1>
      {value.description ? <p>{value.description}</p> : null}
    </>
  );
}
function Action({ value }: { value: { label: string; destination: string } }) {
  const { tenantSlug } = useTenant();
  const { config } = usePresentation();
  if ((value.destination === "reserve" && config?.features.reservations === false) ||
      (value.destination === "menu" && config?.features.menu === false)) return null;
  return (
    <Link
      className="wl-button"
      to={`/${encodeURIComponent(tenantSlug)}${value.destination === "home" ? "" : "/" + value.destination}`}
    >
      {value.label}
    </Link>
  );
}
function Branch({
  branch,
  display,
  ratio = "landscape",
  index,
  home = false,
}: {
  branch: RestaurantBranchDetail;
  display: WebsiteConfigV1["pages"]["locations"]["display"];
  ratio?: string;
  index?: number;
  home?: boolean;
}) {
  const { tenantSlug } = useTenant();
  const { config } = usePresentation();
  const reservationsOn = config?.features.reservations !== false;
  return (
    <article className={`ws-branch ${home ? "ws-branch-home" : "ws-branch-detail"}`}>
      <div className="ws-branch-photo">
      <Photo
        src={branch.coverImageUrl || branch.photos[0]?.url}
        style={{
          aspectRatio:
            ratio === "square" ? "1" : ratio === "portrait" ? "3/4" : "16/10",
        }}
      />
      {index !== undefined && <span className="ws-branch-number">{String(index + 1).padStart(2, "0")}</span>}
      </div>
      <div className="ws-branch-content">
      {display.cuisine && branch.cuisineName && <span className="ws-branch-kicker">{branch.cuisineName}</span>}
      <h2>{branch.name}</h2>
      {branch.about && <p className="ws-branch-about">{branch.about}</p>}
      {display.address && <p className="ws-branch-address">{branch.addressSummary}</p>}
      {display.phone && branch.phone && <p><a href={`tel:${branch.phone}`}>{branch.phone}</a></p>}
      {display.email && <p>{branch.email}</p>}
      {display.openStatus && (
        <p>{branch.isOpen ? "Open now" : "Opening hours below"}</p>
      )}
      {display.hours && (
        <ul>
          {branch.hours.map((h) => (
            <li key={h.dayOfWeek}>
              {h.dayLabel}: {h.summary}
            </li>
          ))}
        </ul>
      )}
      {display.amenities && (
        <p>{branch.amenities.map((a) => a.name).join(" · ")}</p>
      )}
      {display.policies && (
        <p>
          Deposit: {branch.policies.depositAmount}{" "}
          {branch.policies.depositCurrency}. Grace period:{" "}
          {branch.policies.gracePeriodMinutes ?? "—"} minutes.
        </p>
      )}
      {reservationsOn && display.reserve ? <Link
        className="wl-button"
        to={`/${encodeURIComponent(tenantSlug)}/reserve?branch=${encodeURIComponent(branch.id)}`}
      >
        Reserve a table
      </Link> : <a className="wl-button" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.name} ${branch.addressSummary}`)}`} target="_blank" rel="noopener noreferrer">Get directions</a>}
      </div>
    </article>
  );
}
function MenuPreview() {
  const { menu } = useTenant();
  const { config } = usePresentation();
  if (!menu || config?.features.menu === false) return null;
  return (
    <Selectable id="menu" className="ws-section">
      <h2>From our menu</h2>
      <div className="ws-grid">
        {menu.sections
          .flatMap((s) => s.items)
          .filter((i) => i.available)
          .slice(0, 3)
          .map((i, n) => (
            <article key={n}>
              {i.imageUrl && <Photo src={i.imageUrl} />}
              <h3>{i.name}</h3>
              <p>{i.description}</p>
              <p>
                {i.price} {menu.currency}
              </p>
            </article>
          ))}
      </div>
    </Selectable>
  );
}
function Home() {
  const { config: c, preview } = usePresentation();
  const { branches, tenant } = useTenant();
  const media = useMedia();
  const locationsTrack = useRef<HTMLDivElement>(null);
  const [activeLocation, setActiveLocation] = useState(0);
  const updateActiveLocation = () => {
    const track = locationsTrack.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const closest = cards.reduce(
      (best, card, index) =>
        Math.abs(card.offsetLeft - cards[0].offsetLeft - track.scrollLeft) <
        Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - track.scrollLeft)
          ? index
          : best,
      0,
    );
    setActiveLocation(closest);
  };
  const goToLocation = (index: number) => {
    const track = locationsTrack.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - (track.children[0] as HTMLElement).offsetLeft, behavior: "smooth" });
    setActiveLocation(index);
  };
  if (!c) return null;
  const h = c.pages.home;
  const galleryImages = preview ? h.gallery.images : h.gallery.images.filter((ref) => Boolean(media(ref)));
  return (
    <>
      {c.homeOrder.map((id) => {
        const s = h[id];
        const section = !s.visible ? null : id === "hero" ? (
          <Selectable
            id="home.hero"
            className={`ws-hero ws-hero-${h.hero.variant} ws-tone-${h.hero.tone}`}
            style={{ textAlign: h.hero.alignment }}
          >
            <Photo
              src={media(h.hero.image)}
              style={{ objectPosition: `${h.hero.focalX}% ${h.hero.focalY}%` }}
            />
            <div
              className="ws-hero-copy"
              style={{ background: `rgb(0 0 0 / ${h.hero.overlay}%)` }}
            >
              <Copy value={h.hero} />
              <div className="ws-actions">
                <Action value={h.hero.primary} />
                <Action value={h.hero.secondary} />
              </div>
            </div>
          </Selectable>
        ) : id === "story" ? (
          <Selectable
            id="home.story"
            className={`ws-section ws-story ws-story-${h.story.variant} ws-tone-${h.story.tone} ${media(h.story.image) ? "" : "ws-story-no-image"}`}
          >
            <div className="ws-story-copy">
              <Copy value={h.story} />
              <p>{h.story.body || tenant?.about}</p>
            </div>
            {h.story.variant !== "text" && (
              <Photo className="ws-story-photo" src={media(h.story.image)} />
            )}
          </Selectable>
        ) : id === "locations" ? (
          <Selectable
            id="home.locations"
            className={`ws-section ws-locations ws-locations-${h.locations.variant} ws-tone-${h.locations.tone}`}
          >
            <Copy value={h.locations} />
            <span className="ws-locations-count">{String(branches.length).padStart(2, "0")} {branches.length === 1 ? "LOCATION" : "LOCATIONS"}</span>
            <div className="ws-grid" id="home-locations-carousel" ref={locationsTrack} onScroll={updateActiveLocation}>
              {branches.map((b, index) => (
                <Branch
                  key={b.id}
                  branch={b}
                  display={h.locations.display}
                  ratio={h.locations.imageRatio}
                  index={index}
                  home
                />
              ))}
            </div>
            {branches.length > 1 && (
              <div className="ws-locations-carousel-controls" aria-label="Location carousel controls">
                <span className="ws-locations-carousel-label">Explore our locations</span>
                <span className="ws-locations-carousel-progress" aria-live="polite">
                  {String(Math.min(activeLocation, branches.length - 1) + 1).padStart(2, "0")}
                  <span aria-hidden="true"> / </span>
                  {String(branches.length).padStart(2, "0")}
                </span>
                <div className="ws-locations-carousel-buttons">
                  <button type="button" aria-label="Previous location" aria-controls="home-locations-carousel" disabled={activeLocation === 0} onClick={() => goToLocation(activeLocation - 1)}>←</button>
                  <button type="button" aria-label="Next location" aria-controls="home-locations-carousel" disabled={activeLocation >= branches.length - 1} onClick={() => goToLocation(activeLocation + 1)}>→</button>
                </div>
              </div>
            )}
            {!branches.length && <p>No locations added yet.</p>}
          </Selectable>
        ) : id === "gallery" ? (galleryImages.length ? (
          <Selectable id="home.gallery" className={`ws-section ws-gallery-section ws-tone-${h.gallery.tone}`}>
            <Copy value={h.gallery} />
            <div className={`ws-gallery ws-gallery-${h.gallery.variant}`}>
              {galleryImages.map((r, i) => (
                <Photo key={i} src={media(r)} />
              ))}
            </div>
          </Selectable>
        ) : null) : (
          <Selectable
            id="home.cta"
            className={`ws-section ws-cta ws-cta-${h.cta.layout} ws-background-${h.cta.background}`}
            style={
              h.cta.background === "image"
                ? {
                    backgroundImage: media(h.cta.image)
                      ? `linear-gradient(#0006,#0006),url("${media(h.cta.image)}")`
                      : undefined,
                  }
                : undefined
            }
          >
            <Copy value={h.cta} />
            <Action value={h.cta.action} />
          </Selectable>
        );
        return (
          <div key={id}>
            {section}
            {id === "locations" && <MenuPreview />}
          </div>
        );
      })}
    </>
  );
}
function Content({ page }: { page: string }) {
  const [query, setQuery] = useSearchParams();
  const { config: c, branchId, preview } = usePresentation();
  const { tenant, tenantSlug, branches, menu } = useTenant();
  const media = useMedia();
  const [chosen, setChosen] = useState("");
  if (!c) return null;
  const selected =
    branches.find(
      (b) =>
        b.id ===
        (chosen ||
          branchId ||
          query.get("branch") ||
          c.pages.locations.defaultBranchId),
    ) || branches[0];
  if (page === "home") return <Home />;
  if (page === "about") {
    const a = c.pages.about;
    const aboutImage = media(a.image);
    const heroCandidates = [
      selected?.coverImageUrl,
      ...branches.flatMap((branch) => [branch.coverImageUrl, ...branch.photos.map((photo) => photo.url)]),
    ];
    const hero = heroCandidates.find((image) => image && image !== aboutImage) || aboutImage || heroCandidates.find(Boolean);
    const values = a.values.filter((value) => value.title.trim() || value.description.trim());
    return (
      <Selectable id="about" className="ws-about-page">
        <header className="ws-about-hero">
          {hero ? <Photo src={hero} /> : null}
          <div className="ws-about-hero-copy">
            <Copy value={a} />
          </div>
          <span className="ws-about-hero-index">01 / About us</span>
        </header>
        <section className="ws-about-story">
          <div className="ws-about-story-copy">
            <span className="wl-kicker">Our story</span>
            <h2>{a.storyTitle}</h2>
            {(a.storyBody ?? tenant?.about) && <p>{a.storyBody ?? tenant?.about}</p>}
          </div>
          <div className="ws-about-story-photo">
            <Photo src={aboutImage || selected?.photos.find((photo) => photo.url !== hero)?.url || hero} />
          </div>
        </section>
        {values.length > 0 && (
          <section className="ws-about-values">
            <div className="ws-about-values-heading">
              <span className="wl-kicker">What matters to us</span>
              <h2>The things that bring us together.</h2>
            </div>
            <div className="ws-about-values-grid">
              {values.map((value, index) => (
                <article key={index}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{value.title}</h3>
                  {value.description && <p>{value.description}</p>}
                </article>
              ))}
            </div>
          </section>
        )}
        <section className="ws-about-invite">
          <span className="wl-kicker">Your table is waiting</span>
          <h2>We would love to see you.</h2>
          <p>Choose your location and settle in.</p>
          <div className="ws-about-invite-actions">
            {c.features.reservations !== false && <Link className="wl-button" to={`/${encodeURIComponent(tenantSlug)}/reserve`}>Reserve a table</Link>}
            <Link className="ws-about-text-link" to={`/${encodeURIComponent(tenantSlug)}/locations`}>Our locations <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </Selectable>
    );
  }
  if (page === "locations")
    return (
      <Selectable id="locations" className="ws-location-page">
        <header className="ws-location-page-hero">
          {selected && (selected.coverImageUrl || selected.photos[0]?.url) ? <img src={selected.coverImageUrl || selected.photos[0]?.url} alt="" /> : null}
          <div className="ws-location-page-hero-copy">
            <Copy value={c.pages.locations} />
          </div>
          <span className="ws-location-page-count">{String(branches.length).padStart(2, "0")} {branches.length === 1 ? "location" : "locations"}</span>
        </header>
        {branches.length > 1 && (
          <nav className="ws-location-page-switcher" aria-label="Choose a location">
            <span className="wl-kicker">Explore our locations</span>
            <div>
              {branches.map((b, index) => (
                <button type="button" data-preview-control key={b.id} className={selected?.id === b.id ? "is-active" : ""} aria-current={selected?.id === b.id ? "true" : undefined} onClick={() => { setChosen(b.id); if (!preview) setQuery({ branch: b.id }); }}>
                  <span>{String(index + 1).padStart(2, "0")}</span>{b.name}
                </button>
              ))}
            </div>
          </nav>
        )}
        {selected ? (
          <div className="ws-location-page-feature">
            <Branch branch={selected} display={c.pages.locations.display} />
          </div>
        ) : <p className="ws-location-page-empty">No locations added yet.</p>}
      </Selectable>
    );
  if (page === "policies")
    return (
      <Selectable id={page} className="ws-section">
        <h1>{c.pages.policies.heading}</h1>
        <p>{c.pages.policies.introduction}</p>
        <label>
          Location{" "}
          <select
            value={selected?.id || ""}
            onChange={(e) => setChosen(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        {!selected ? (
          <p>No locations added yet.</p>
        ) : (
          <div className="ws-grid">
            {c.pages.policies.deposit && (
              <article>
                <h2>Deposit</h2>
                <p>
                  {selected.policies.depositAmount}{" "}
                  {selected.policies.depositCurrency}
                </p>
              </article>
            )}
            {c.pages.policies.cancellation && (
              <article>
                <h2>Cancellation</h2>
                <p>
                  Free cancellation:{" "}
                  {selected.policies.freeCancelWindowHours ?? "—"} hours before
                  booking.
                </p>
              </article>
            )}
            {c.pages.policies.gracePeriod && (
              <article>
                <h2>Grace period</h2>
                <p>{selected.policies.gracePeriodMinutes ?? "—"} minutes.</p>
              </article>
            )}
            {c.pages.policies.bookingWindow && (
              <article>
                <h2>Booking window</h2>
                <p>
                  {selected.policies.bookingCutoffHours ?? "—"} hours before
                  booking.
                </p>
              </article>
            )}
          </div>
        )}
      </Selectable>
    );
  if (page === "reserve")
    return (
      <Selectable id="reserve">
        <ReservationFrame
          step={1}
          summary={
            selected ? (
              <>
                <Photo src={selected.coverImageUrl} />
                <h2>{selected.name}</h2>
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
    <Selectable id="menu" className="ws-section ws-menu-page">
      <h1>Menu</h1>
      {!menu ? (
        <p>No menu is published yet.</p>
      ) : (
        menu.sections.map((s, i) => (
          <section key={i} className="ws-menu-section">
            {s.eyebrow && <span className="ws-menu-note">{s.eyebrow}</span>}
            <h2>{s.name}</h2>
            <div className="ws-menu-grid">
              {s.items.map((item, n) => (
                <article key={n} className="ws-menu-entry">
                  {item.imageUrl && <Photo src={item.imageUrl} />}
                  <div className="ws-menu-entry-heading">
                    <h3>{item.name}</h3>
                    {item.price !== null && <span className="ws-menu-price">{item.price} {menu.currency}</span>}
                  </div>
                  {item.description && <p>{item.description}</p>}
                  {!!item.tags.length && <p className="ws-menu-tags">{item.tags.join(" · ")}</p>}
                  {!item.available && <p>Unavailable</p>}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </Selectable>
  );
}
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
  const reservationsOn = c.features.reservations !== false;
  const menuOn = c.features.menu !== false;
  if (!p.preview && ((page === "reserve" && !reservationsOn) || (page === "menu" && !menuOn))) {
    return <Navigate to={`/${encodeURIComponent(tenantSlug)}/locations`} replace />;
  }
  const t = c.theme;
  const fonts = typographyStacks[t.typography];
  const path = (id: string) =>
    `/${encodeURIComponent(tenantSlug)}${id === "home" ? "" : "/" + id}`;
  const style = {
    "--wl-accent": t.primaryColor,
    "--wl-accent-dark": t.accentDark,
    "--wl-on-accent": contrastTextFor(t.primaryColor),
    "--wl-on-accent-dark": contrastTextFor(t.accentDark),
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
  // Back-compat: navTextColor is a new field, so normalizing an older stored
  // draft fills it with the schema default (matching the historic
  // white/transparent nav color). The "brand" variant used to force white nav
  // text regardless of that value; an old brand-variant draft has no way to
  // express "unset", so it is left forcing white (via the CSS default below)
  // unless the value differs from the schema default, which only happens
  // when a person has actually chosen a color in the editor.
  const navTextCustomized = c.header.navTextColor !== "#4f4a44";
  const navTextOverride =
    c.header.variant !== "brand" || navTextCustomized
      ? c.header.navTextColor
      : undefined;
  return (
    <div className={`wl-site ws-site ws-buttons-${t.buttonFill}`} style={style}>
      <Selectable
        id="header" as="header"
        className={`wl-header ws-header ws-header-${c.header.variant}`}
        style={{
          position: c.header.sticky ? "sticky" : "relative",
          "--ws-logo-size": `${c.brand.logoSize}px`,
          ...(navTextOverride ? { "--ws-nav-text": navTextOverride } : {}),
          "--ws-header-bg": c.header.customBackground,
        } as CSSProperties}
      >
        <Link className="wl-wordmark ws-wordmark" to={path("home")}>
          {c.brand.logoDisplay !== "name-only" && (
            <Photo
              src={media(c.brand.logo)}
              className="ws-brand-logo"
              style={{ width: c.brand.logoSize, height: c.brand.logoSize }}
            />
          )}
          {c.brand.logoDisplay !== "logo-only" && (
            <span>
              {c.brand.shortName || tenant.name}
              <small>{c.brand.tagline}</small>
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
        <nav className={`wl-nav ws-nav ${open ? "is-open" : ""}`}>
          {Object.entries(c.header.navigation)
            .filter(
              ([id, n]) =>
                n.visible && id !== "reserve" && (id !== "menu" || (menuOn && menu)),
            )
            .map(([id, n]) => (
              <Link key={id} to={path(id)} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
          {reservationsOn && <Link className="wl-button" to={path("reserve")}>
            {c.header.reservationLabel}
          </Link>}
        </nav>
      </Selectable>
      <main id="main-content">{children || <Content page={page} />}</main>
      <Selectable
        id="footer"
        as="footer"
        className="wl-footer"
        style={{ "--ws-logo-size": `${c.brand.logoSize}px` } as CSSProperties}
      >
        <div>
          {c.footer.showLogo && (
            <Photo
              src={media(c.brand.logo)}
              className="ws-brand-logo"
              style={{ width: c.brand.logoSize, height: c.brand.logoSize }}
            />
          )}
          <h2>{c.brand.shortName || tenant.name}</h2>
          {c.footer.showDescription && (
            <p>{c.footer.description || tenant.about}</p>
          )}
        </div>
        <div className="wl-footer-links">
          {c.footer.locationsLink && (
            <Link to={path("locations")}>Locations</Link>
          )}
          {menuOn && c.footer.menuLink && menu && <Link to={path("menu")}>Menu</Link>}
          {c.footer.policiesLink && <Link to={path("policies")}>Policies</Link>}
          {reservationsOn && <Link to={path("reserve")}>Reserve a table</Link>}
          <div className="ws-social-links">
            {(["instagram", "facebook", "tiktok"] as const).map((id) =>
              c.footer[id] && safeUrl(c.footer[id]) ? (
                <a
                  key={id}
                  href={c.footer[id]}
                  className="ws-social-link"
                  aria-label={socialLabels[id]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {socialIcons[id]}
                </a>
              ) : null,
            )}
          </div>
        </div>
        {c.footer.attribution && <PoweredByTavlo surface="dark" />}
      </Selectable>
    </div>
  );
}
