import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import api, { friendlyError } from '../../lib/api';
import { searchSubServices } from '../../lib/serviceSearch';

/** Where a search hit actually lives. */
function routeFor(result) {
  // Jobs inside a service (a plumbing item, a waterproofing type…) know
  // their own page.
  if (result.route) {
    return result.route;
  }

  if (result.parentSlug === 'electrical') {
    return `/services/electrical/${result.slug}`;
  }

  if (result.slug === 'interior-by-choice') {
    return '/interior-by-choice';
  }

  if (result.slug === 'electrical') {
    return '/services/electrical';
  }

  return `/services/${result.slug}`;
}

/**
 * Homepage hero section.
 */
export default function HomeHero() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const boxRef = useRef(null);

  /* Search */
  useEffect(() => {
    const q = query.trim();

    if (!q) {
      setResults(null);
      setSearchError('');
      return undefined;
    }

    let cancelled = false;

    setSearching(true);

    const timer = setTimeout(() => {
      // The catalogue finds services; the sub-service search finds the jobs
      // inside them (toilet, tap, terrace, false ceiling…). Only the
      // catalogue failing is an error — the extras are a bonus.
      Promise.all([
        api.searchCatalogue(q),
        searchSubServices(q).catch(() => []),
      ])
        .then(([services, jobs]) => {
          if (!cancelled) {
            setResults([...services, ...jobs]);
            setActive(-1);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setSearchError(friendlyError(err));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  /* Close search when clicking outside */
  useEffect(() => {
    if (!open) return undefined;

    const onDocClick = (e) => {
      if (
        boxRef.current &&
        !boxRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocClick);

    return () => {
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open]);

  const goTo = (result) => {
    setOpen(false);
    setQuery('');
    navigate(routeFor(result));
  };

  const showing = open && query.trim() && !searching && !searchError && results?.length > 0;

  // Arrow keys move through the results, Enter opens the highlighted one (or
  // the first, when none is highlighted), Escape closes the list.
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!showing) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goTo(results[active >= 0 ? active : 0]);
    }
  };

  return (
    <section className="home-hero">

      {/* Hero background image */}
      <div className="home-hero-media">
        <img
          src="/assets/hero-team.webp"
          alt="Supplybase professionals at work in a home"
          width={1600}
          height={595}
          // React 18 doesn't special-case this DOM property (that landed in
          // React 19), so the camelCase JSX prop name is passed straight
          // through as a literal, wrongly-cased HTML attribute unless it's
          // spelled the way the browser actually expects it.
          fetchpriority="high"
        />

        <div className="home-hero-gradient" />
      </div>

      <div className="container home-hero-inner">

        {/* Hero text */}
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow">Home &amp; workspace services</p>

          <h1>
            Home services for your
            {' '}
            <span className="home-hero-accent">home &amp; workspace</span>
          </h1>

          <p className="home-hero-sub">
            Skilled professionals, quality work, at your doorstep.
          </p>
        </div>

        {/* Search */}
        <div
          className="home-search"
          ref={boxRef}
        >
          <Icon
            name="search"
            size={21}
            className="home-search-icon"
          />

          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search for a service (e.g. painting, electrician)"
            aria-label="Search for a service"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="home-search-results"
            aria-expanded={!!showing}
            aria-activedescendant={showing && active >= 0 ? `home-search-opt-${active}` : undefined}
          />

          {/* Search results */}
          {open && query.trim() && (
            <div
              className="home-search-results"
              id="home-search-results"
              role="listbox"
              aria-label="Matching services"
            >
              {searching && (
                <p className="home-search-status" role="status">
                  Searching…
                </p>
              )}

              {!searching && searchError && (
                <p className="home-search-status error">
                  {searchError}
                </p>
              )}

              {!searching &&
                !searchError &&
                results &&
                results.length === 0 && (
                  <p className="home-search-status">
                    No services found for &ldquo;
                    {query.trim()}
                    &rdquo;. Try painting, plumbing or electrician.
                  </p>
                )}

              {!searching &&
                !searchError &&
                results &&
                results.map((r, i) => (
                  <button
                    key={`${r.parentSlug || ''}-${r.slug}`}
                    id={`home-search-opt-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    tabIndex={-1}
                    className={`home-search-result ${i === active ? 'is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => goTo(r)}
                  >
                    <Icon
                      name={r.icon}
                      size={17}
                    />

                    <span>
                      <strong>{r.name}</strong>

                      {r.tagline && (
                        <small>{r.tagline}</small>
                      )}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );}