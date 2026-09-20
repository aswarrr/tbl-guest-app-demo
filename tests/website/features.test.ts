import { describe, it, expect } from "vitest";
import {
  createDefaults,
  normalizeConfig,
  validateConfig,
  type WebsiteConfigV1,
} from "../../src/website/contract";

const COMPANY = { id: "company", name: "Restaurant", about: null };
const current = () => createDefaults(COMPANY, []);

describe("website capabilities", () => {
  it("ships every capability on, so an existing site behaves as it did", () => {
    expect(current().features).toEqual({
      menu: true,
      reservations: true,
      tableSelection: true,
    });
  });

  // The guest app validates the published configuration and drops it whole when
  // it fails, falling back to unstyled chrome. A site published before
  // `features` existed must therefore survive the upgrade.
  it("rescues a site published before capabilities existed", () => {
    const published = current() as Partial<WebsiteConfigV1>;
    delete published.features;

    expect(validateConfig(published, COMPANY.id)).toHaveLength(1);

    const upgraded = normalizeConfig(published) as WebsiteConfigV1;
    expect(validateConfig(upgraded, COMPANY.id)).toEqual([]);
    expect(upgraded.features.reservations).toBe(true);
  });

  it("keeps a capable configuration byte-identical", () => {
    const config = current();
    expect(JSON.stringify(normalizeConfig(config))).toBe(JSON.stringify(config));
  });
});

describe("capability coherence", () => {
  /** Reservations off, with the links that point at them cleared. */
  const reservationsOff = () => {
    const config = current();
    config.features.reservations = false;
    config.features.tableSelection = false;
    config.header.navigation.reserve.visible = false;
    config.pages.home.cta.visible = false;
    return config;
  };

  it("accepts a site that takes no reservations", () => {
    expect(validateConfig(reservationsOff(), COMPANY.id)).toEqual([]);
  });

  it("refuses to leave a reservation link pointing at a dead route", () => {
    const config = reservationsOff();
    config.header.navigation.reserve.visible = true;
    expect(validateConfig(config, COMPANY.id)).toContain(
      "Turn off the reservation links when online reservations are off.",
    );
  });

  it("refuses table selection without reservations", () => {
    const config = reservationsOff();
    config.features.tableSelection = true;
    expect(validateConfig(config, COMPANY.id)).toContain(
      "Table selection requires online reservations.",
    );
  });

  it("refuses a menu link with the menu switched off", () => {
    const config = current();
    config.features.menu = false;
    expect(validateConfig(config, COMPANY.id)).toContain(
      "Turn off the menu link when the menu page is off.",
    );
    config.header.navigation.menu.visible = false;
    expect(validateConfig(config, COMPANY.id)).toEqual([]);
  });

  // The locks exist to guarantee a bookable site. They only bind while the site
  // claims to take bookings.
  it("still pins the reservation link while reservations are on", () => {
    const config = current();
    config.header.navigation.reserve.visible = false;
    expect(validateConfig(config, COMPANY.id).length).toBeGreaterThan(0);
  });
});
