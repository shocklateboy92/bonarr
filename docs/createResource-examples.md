# createResource Examples and Patterns

This document provides practical examples of using `createResource` in various scenarios, based on the implementation patterns used in the Bonarr project.

## Basic TV Show Search Example

Our TVShowSearch component demonstrates several key patterns:

```javascript
import { createSignal, createResource, For, Show } from "solid-js";

export default function TVShowSearch() {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [query, setQuery] = createSignal("");

  // Resource with conditional fetching
  const [tvShows] = createResource(query, async (q) => {
    if (!q) return null; // Don't fetch if no query
    return await searchTVShows(q);
  });

  const handleSearch = () => {
    if (searchQuery().trim()) {
      setQuery(searchQuery().trim()); // Triggers refetch
    }
  };

  return (
    <div>
      {/* Input handling */}
      <input
        value={searchQuery()}
        onInput={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
      />
      <button onClick={handleSearch}>Search</button>

      {/* Loading state */}
      <Show when={tvShows.loading}>
        <div>Loading...</div>
      </Show>

      {/* Error state */}
      <Show when={tvShows.error}>
        <div>Error: {tvShows.error?.message}</div>
      </Show>

      {/* Success state with data */}
      <Show when={tvShows()}>
        {(data) => (
          <>
            <h3>Found {data().total_results} results</h3>
            <For each={data()?.results}>
              {(show) => <div>{show.name}</div>}
            </For>
          </>
        )}
      </Show>
    </div>
  );
}
```

## Pattern Analysis

### 1. Conditional Fetching Pattern

```javascript
const [tvShows] = createResource(query, async (q) => {
  if (!q) return null; // Guard clause prevents unnecessary API calls
  return await searchTVShows(q);
});
```

**Benefits:**
- Prevents API calls when there's no search query
- Returns null for empty states, which can be easily handled in rendering

### 2. Separate Input and Fetch Signals

```javascript
const [searchQuery, setSearchQuery] = createSignal(""); // User input
const [query, setQuery] = createSignal("");             // Actual fetch trigger
```

**Benefits:**
- Prevents API calls on every keystroke
- Gives user control over when to actually search
- Separates concerns between UI state and data fetching

### 3. Type-Safe Show Component Usage

```javascript
<Show when={tvShows()}>
  {(data) => (
    // data is properly typed and guaranteed to be non-null
    <div>{data().total_results}</div>
  )}
</Show>
```

**Benefits:**
- TypeScript knows data is not null inside the callback
- Cleaner code without repeated null checks

## Alternative Patterns

### Using Switch/Match Instead of Multiple Show Components

```javascript
import { Switch, Match } from "solid-js";

<Switch>
  <Match when={tvShows.loading}>
    <LoadingSpinner />
  </Match>
  <Match when={tvShows.error}>
    <ErrorMessage error={tvShows.error} />
  </Match>
  <Match when={tvShows()}>
    <SearchResults data={tvShows()} />
  </Match>
  <Match when={!query()}>
    <EmptyState message="Enter a search term to begin" />
  </Match>
</Switch>
```

### Debounced Search Pattern

```javascript
import { createSignal, createResource, createEffect } from "solid-js";

export default function DebouncedSearch() {
  const [searchInput, setSearchInput] = createSignal("");
  const [debouncedQuery, setDebouncedQuery] = createSignal("");

  // Debounce effect
  createEffect(() => {
    const input = searchInput();
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(input);
    }, 300);

    return () => clearTimeout(timeoutId);
  });

  const [results] = createResource(debouncedQuery, async (query) => {
    if (!query.trim()) return null;
    return await searchAPI(query);
  });

  return (
    <div>
      <input
        value={searchInput()}
        onInput={(e) => setSearchInput(e.target.value)}
        placeholder="Search as you type..."
      />
      
      <Show when={results.loading}>
        <div>Searching...</div>
      </Show>
      
      <Show when={results()}>
        {(data) => (
          <For each={data().results}>
            {(item) => <div>{item.name}</div>}
          </For>
        )}
      </Show>
    </div>
  );
}
```

### Pagination Pattern

```javascript
export default function PaginatedResults() {
  const [page, setPage] = createSignal(1);
  const [searchTerm, setSearchTerm] = createSignal("");

  // Combine multiple signals into a single source
  const searchParams = () => ({ 
    query: searchTerm(), 
    page: page() 
  });

  const [results] = createResource(searchParams, async (params) => {
    if (!params.query) return null;
    return await searchWithPagination(params.query, params.page);
  });

  return (
    <div>
      <input
        value={searchTerm()}
        onInput={(e) => setSearchTerm(e.target.value)}
      />
      
      <Show when={results()}>
        {(data) => (
          <>
            <For each={data().results}>
              {(item) => <div>{item.name}</div>}
            </For>
            
            {/* Pagination controls */}
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page() === 1}
            >
              Previous
            </button>
            
            <span>Page {page()} of {data().total_pages}</span>
            
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page() >= data().total_pages}
            >
              Next
            </button>
          </>
        )}
      </Show>
    </div>
  );
}
```

### Optimistic Updates with Error Recovery

```javascript
export default function OptimisticList() {
  const [items, { mutate, refetch }] = createResource(fetchItems);

  const addItem = async (newItem) => {
    // Optimistically add to UI
    const previousItems = items();
    mutate(prev => [...(prev || []), { ...newItem, id: Date.now() }]);

    try {
      const savedItem = await createItem(newItem);
      // Replace temporary item with server response
      mutate(prev => prev?.map(item => 
        item.id === newItem.id ? savedItem : item
      ));
    } catch (error) {
      // Revert on error
      mutate(previousItems);
      console.error("Failed to add item:", error);
    }
  };

  const deleteItem = async (itemId) => {
    const previousItems = items();
    mutate(prev => prev?.filter(item => item.id !== itemId));

    try {
      await deleteItemAPI(itemId);
    } catch (error) {
      mutate(previousItems);
      console.error("Failed to delete item:", error);
    }
  };

  return (
    <div>
      <Show when={items()}>
        {(data) => (
          <For each={data()}>
            {(item) => (
              <div>
                {item.name}
                <button onClick={() => deleteItem(item.id)}>
                  Delete
                </button>
              </div>
            )}
          </For>
        )}
      </Show>
      
      <button onClick={() => addItem({ name: "New Item" })}>
        Add Item
      </button>
    </div>
  );
}
```

## Error Handling Patterns

### Custom Error Component

```javascript
function ErrorDisplay({ error, onRetry }) {
  return (
    <div class="error-container">
      <h3>Something went wrong</h3>
      <p>{error?.message || "Unknown error occurred"}</p>
      <button onClick={onRetry}>Try Again</button>
    </div>
  );
}

// Usage
<Show when={data.error}>
  <ErrorDisplay 
    error={data.error} 
    onRetry={() => refetch()} 
  />
</Show>
```

### Network-Specific Error Handling

```javascript
const [data] = createResource(async () => {
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error
      throw new Error("Network connection failed. Please check your internet connection.");
    }
    throw error; // Re-throw other errors
  }
});
```

## Performance Considerations

### Avoiding Unnecessary Refetches

```javascript
// Bad: Creates new object on every render, causing refetch
const params = () => ({ query: search(), page: currentPage() });

// Good: Use createMemo for complex computations
const params = createMemo(() => ({ 
  query: search(), 
  page: currentPage() 
}));
```

### Resource Cleanup

```javascript
export default function ComponentWithCleanup() {
  const [data] = createResource(fetchData);

  onCleanup(() => {
    // Cancel pending requests, cleanup timers, etc.
    if (data.loading) {
      // Handle cleanup if needed
    }
  });

  return <div>/* component */</div>;
}
```

These patterns provide a foundation for building robust, user-friendly data fetching in SolidJS applications.