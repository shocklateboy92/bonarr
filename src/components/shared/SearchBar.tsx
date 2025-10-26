import { createSignal, createMemo, Accessor, Show, type JSX } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { TextField, IconButton, InputAdornment } from "@suid/material";
import { Search, Clear } from "@suid/icons-material";
import { createScheduled, debounce } from "@solid-primitives/scheduled";

interface SearchBarProps {
  label: string;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Shared search bar component with debouncing and URL query parameter syncing
 * Manages the 'q' query parameter automatically
 * Returns the debounced query value for use in parent components
 */
export default function SearchBar(props: SearchBarProps): {
  debouncedQuery: Accessor<string>;
  input: JSX.Element;
} {
  const { label, placeholder, debounceMs = 500 } = props;
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize query from URL parameter
  const [query, setQuery] = createSignal(
    Array.isArray(searchParams.q)
      ? searchParams.q[0] || ""
      : searchParams.q || "",
  );

  // Create a debounced signal using solid-primitives
  const scheduled = createScheduled((fn) => debounce(fn, debounceMs));

  const debouncedQuery = createMemo((prev: string = "") => {
    const currentQuery = query();
    // Trigger the scheduled update
    if (scheduled()) {
      // Update search params when debounced query changes
      if (currentQuery.trim()) {
        setSearchParams({ q: currentQuery });
      } else {
        setSearchParams({});
      }
      return currentQuery;
    }
    return prev;
  });

  const handleSearch = () => {
    const searchTerm = query().trim();
    if (searchTerm) {
      setSearchParams({ q: searchTerm });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchParams({});
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const input = (
    <TextField
      fullWidth
      label={label}
      placeholder={placeholder}
      variant="outlined"
      value={query()}
      onChange={(e) => setQuery(e.target.value)}
      onKeyPress={handleKeyPress}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Show when={query().trim()}>
              <IconButton onClick={handleClear} edge="end">
                <Clear />
              </IconButton>
            </Show>
            <IconButton
              onClick={handleSearch}
              edge="end"
              disabled={!query().trim()}
              color="primary"
            >
              <Search />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );

  return { debouncedQuery, input };
}
