import api from './api';
import { paintingCategories } from '../data/paintingContent';
import { wpCategories, wpBathroomServices } from '../data/waterproofingContent';
import { popCategories } from '../data/popCeilingContent';
import { plumbingTabs } from '../data/plumbingContent';
import { dedupeItems } from '../hooks/usePlumbingCatalogue';

/**
 * Search for the things inside a service.
 *
 * The catalogue search (GET /api/catalogue/search) finds top-level services
 * and the electrician's sub-services, but not the jobs listed inside the
 * other services — so "toilet", "tap", "drain", "terrace" or "false ceiling"
 * found nothing even though we do them. This covers those: the painting,
 * waterproofing and POP options and every plumbing job, each with the page
 * that opens it. Results have the same shape as the catalogue's, plus a
 * `route`.
 */

const fromContent = (items, icon) =>
  items.map((item) => ({
    slug: item.route,
    name: item.name,
    tagline: item.tagline,
    icon: item.icon || icon,
    route: item.route,
  }));

// Static, so it costs nothing to build once.
const staticEntries = [
  ...fromContent(paintingCategories, 'roller'),
  ...fromContent(wpCategories, 'droplet'),
  ...fromContent(wpBathroomServices, 'droplet'),
  ...fromContent(popCategories, 'ceiling'),
  ...plumbingTabs.map((tab) => ({
    slug: `/services/plumbing/${tab.slug}`,
    name: tab.name,
    tagline: tab.heroTagline,
    icon: tab.icon,
    route: `/services/plumbing/${tab.slug}`,
  })),
];

// The plumbing jobs are priced items in the catalogue, fetched once.
let plumbingEntries = null;
let plumbingRequest = null;

function loadPlumbingEntries() {
  if (plumbingEntries) return Promise.resolve(plumbingEntries);

  if (!plumbingRequest) {
    plumbingRequest = api
      .serviceForm('plumbing')
      .then((form) => {
        const question = form?.questions?.find((q) => q.key === 'cart_item');
        plumbingEntries = dedupeItems(question?.options || []).map((option) => {
          const tab = plumbingTabs.find((t) => t.group === option.group);
          return {
            slug: `plumbing-item-${option.value}`,
            name: option.label,
            tagline: `Plumber · ${tab?.name || option.group}`,
            icon: tab?.icon || 'tap',
            route: tab ? `/services/plumbing/${tab.slug}` : '/services/plumbing',
          };
        });
        return plumbingEntries;
      })
      .catch(() => {
        // Search still works without them; try again on the next query.
        plumbingRequest = null;
        return [];
      });
  }

  return plumbingRequest;
}

/** Every word typed must appear in the entry's name or description. */
const matches = (entry, words) => {
  const haystack = `${entry.name} ${entry.tagline || ''}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
};

/** Matching sub-service and job entries for a query, best (name) matches first. */
export async function searchSubServices(query, limit = 6) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const plumbing = await loadPlumbingEntries();
  const hits = [...staticEntries, ...plumbing].filter((entry) => matches(entry, words));

  const inName = (entry) => words.every((word) => entry.name.toLowerCase().includes(word));
  hits.sort((a, b) => Number(inName(b)) - Number(inName(a)));

  return hits.slice(0, limit);
}
