import { useState, useEffect } from 'react';

export function useSearch(language: string) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ', Kyiv')}&format=json&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'SvitliachokApp/1.0',
              'Accept-Language': language.startsWith('uk') ? 'uk,en;q=0.9' : 'en,uk;q=0.9',
            },
          },
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.warn('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    closeSearch,
  };
}
