import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { TenantContext } from '../../src/context/tenant-context';
import { PresentationContext } from '../../src/website/presentation';
import { createDefaults } from '../../src/website/contract';
import { StudioSite } from '../../src/website/StudioSite';

const tenant = { id: 'company', slug: 'seafood', name: 'Seafood', currency: 'EGP', about: null, logoUrl: null, coverUrl: null };
function render(reservations: boolean, menu: boolean) {
  const config = createDefaults(tenant);
  config.features.reservations = reservations;
  config.features.menu = menu;
  return renderToStaticMarkup(
    <MemoryRouter>
      <TenantContext.Provider value={{ tenant, tenantSlug: tenant.slug, branches: [], menu: { currency: 'EGP', updatedAt: null, sections: [] }, loading: false, error: '', notFound: false, refresh: async () => {} }}>
        <PresentationContext.Provider value={{ config, preview: false, branchId: null, selection: '', select: () => {} }}>
          <StudioSite page="home" />
        </PresentationContext.Provider>
      </TenantContext.Provider>
    </MemoryRouter>,
  );
}
describe('guest website capabilities', () => {
  it('removes booking and menu links even when older navigation and CTA settings still request them', () => {
    const html = render(false, false);
    expect(html).not.toContain('href="/seafood/reserve');
    expect(html).not.toContain('href="/seafood/menu');
    expect(html).not.toContain('From our menu');
    expect(html).toContain('href="/seafood/locations');
  });
  it('preserves reservation and menu links for enabled websites', () => {
    const html = render(true, true);
    expect(html).toContain('href="/seafood/reserve');
    expect(html).toContain('href="/seafood/menu');
  });
});
