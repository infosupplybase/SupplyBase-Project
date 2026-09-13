import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import api, { friendlyError } from '../../lib/api';

/** Where a search hit actually lives. */
function routeFor(result) {
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
      api
        .searchCatalogue(q)
        .then((data) => {
          if (!cancelled) {
            setResults(data);
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

  return (
    <section className="home-hero">

      {/* Hero background image */}
      <div className="home-hero-media">
        <img
          src="/assets/hero-house2.jpeg"
          alt="Luxury modern house"
          width={1800}
          height={1500}
          fetchPriority="high"
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
            placeholder="Search for a service (e.g. painting, electrician)"
            aria-label="Search for a service"
          />

          {/* Search results */}
          {open && query.trim() && (
            <div
              className="home-search-results"
              role="listbox"
            >
              {searching && (
                <p className="home-search-status">
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
                results.map((r) => (
                  <button
                    key={`${r.parentSlug || ''}-${r.slug}`}
                    type="button"
                    className="home-search-result"
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