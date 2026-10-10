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
 * waterproofing and POP options, every plumbing job, and the Interior by
 * Choice spaces and designs ("study", "mandir", "entrance door"), each with
 * the page that opens it. Results have the same shape as the catalogue's, plus a
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

// Extra words for each Interior by Choice space, so "entrance door" or
// "pooja" finds the right gallery.
const interiorSpaceWords = {
  'tv-wall': 'TV unit and wall panel designs',
  'bed-back-wall': 'Bedroom headboard wall designs',
  'living-room': 'Living room wall panel designs',
  entrance: 'Entrance door and foyer designs',
  study: 'Study table and study room designs',
  mandir: 'Mandir and pooja unit designs',
};

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

// The Interior by Choice catalogue is large, so it loads with the first search
// rather than with the home page.
let interiorRequest = null;

function loadInteriorEntries() {
  if (!interiorRequest) {
    interiorRequest = import('../data/interiorCatalog')
      .then(({ interiorDesigns, interiorSpaces }) => [
        ...interiorSpaces.map((space) => ({
          slug: `/interior-by-choice/${space.slug}`,
          name: `${space.name} designs`,
          tagline: `Interior by Choice · ${interiorSpaceWords[space.slug] || space.name}`,
          icon: 'sofa',
          route: `/interior-by-choice/${space.slug}`,
        })),
        ...interiorDesigns.map((design) => {
          const space = interiorSpaces.find((s) => s.slug === design.spaceSlug);
          return {
            slug: `/interior-by-choice/${design.spaceSlug}/${design.slug}`,
            name: design.name,
            tagline: `Interior by Choice · ${interiorSpaceWords[design.spaceSlug] || space?.name || ''}`,
            icon: 'sofa',
            route: `/interior-by-choice/${design.spaceSlug}/${design.slug}`,
          };
        }),
      ])
      .catch(() => {
        interiorRequest = null;
        return [];
      });
  }
  return interiorRequest;
}

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

const queryWords = (query) => String(query || '').toLowerCase().split(/\s+/).filter(Boolean);

const startsAWord = (text, word) =>
  text.split(/[^a-z0-9]+/).some((part) => part.startsWith(word));

/**
 * How well an entry matches, lower is better: a word in the name starts with
 * what was typed ("ac" → "AC Services"), the name merely contains it
 * ("ac" → "Interior by Choice"), a word in the description starts with it,
 * or it only appears somewhere in the description ("ac" → "space").
 * An entry is as good as its worst-matching word.
 */
function matchRank(entry, words) {
  const name = String(entry.name || '').toLowerCase();
  const tagline = String(entry.tagline || '').toLowerCase();
  return Math.max(
    ...words.map((word) => {
      if (startsAWord(name, word)) return 0;
      if (name.includes(word)) return 1;
      if (startsAWord(tagline, word)) return 2;
      return 3;
    }),
  );
}

/**
 * Best matches first. The sort is stable, so equally good results keep the
 * order they came in (main services before the jobs inside them).
 */
export function rankResults(results, query) {
  const words = queryWords(query);
  if (!words.length) return results;
  return results
    .map((entry, index) => ({ entry, index, rank: matchRank(entry, words) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ entry }) => entry);
}

/** Matching sub-service and job entries for a query, best matches first. */
export async function searchSubServices(query, limit = 6) {
  const words = queryWords(query);
  if (!words.length) return [];

  const [plumbing, interior] = await Promise.all([loadPlumbingEntries(), loadInteriorEntries()]);
  const hits = [...staticEntries, ...plumbing, ...interior].filter((entry) => matches(entry, words));

  return rankResults(hits, query).slice(0, limit);
}
