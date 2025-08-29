# SolidJS Data Fetching Best Practices

## Overview

SolidJS provides `createResource` as a specialized utility for handling asynchronous data fetching. It's designed to integrate seamlessly with Solid's reactive system while providing excellent user experience through proper state management.

## Core Concepts

### What is createResource?

`createResource` is a specialized signal designed specifically for managing asynchronous data fetching. It wraps around async operations, providing a way to handle various states: loading, success, and error.

### Key Benefits

- **Non-blocking**: Guarantees the application remains responsive during data fetching
- **Reactive**: Automatically updates when dependencies change
- **SSR-friendly**: Works well with server-side rendering in SolidStart
- **Built-in state management**: Handles loading, error, and success states automatically

## Basic Usage Patterns

### Without Source Signal

```javascript
const [data, { mutate, refetch }] = createResource(fetchData)
```

### With Source Signal (Reactive Dependency)

```javascript
const [sourceSignal, setSourceSignal] = createSignal('')
const [data, { mutate, refetch }] = createResource(sourceSignal, fetchData)
```

The source signal will retrigger the fetcher whenever it changes, and its value will be passed to the fetcher function.

## Resource Properties

The resource signal provides several useful properties:

- **`data()`** - The current data value
- **`data.loading`** - Boolean indicating if the operation is in progress
- **`data.error`** - Contains error information if the operation fails
- **`data.state`** - Detailed state: "unresolved", "pending", "ready", "refreshing", or "errored"
- **`data.latest`** - The most recent successful data

## Resource Methods

The second return value provides additional methods:

- **`mutate(newData)`** - Directly updates the internal signal (useful for optimistic updates)
- **`refetch()`** - Reloads the current query even if the source hasn't changed

## State Management Patterns

### Using Switch/Match for Comprehensive State Handling

```javascript
import { Switch, Match } from 'solid-js'

<Switch>
  <Match when={data.loading}>
    <div>Loading...</div>
  </Match>
  <Match when={data.error}>
    <div>Error: {data.error.message}</div>
  </Match>
  <Match when={data()}>
    <div>{/* Render your data */}</div>
  </Match>
</Switch>
```

### Using Show Components

```javascript
import { Show } from 'solid-js'

<Show when={data.loading}>
  <div>Loading...</div>
</Show>

<Show when={data.error}>
  <div>Error: {data.error.message}</div>
</Show>

<Show when={data()}>
  {(data) => (
    <div>{/* Render data with proper type narrowing */}</div>
  )}
</Show>
```

## Error Handling Best Practices

### Basic Error Handling

```javascript
const [data] = createResource(async () => {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response.json()
  } catch (error) {
    throw error // Let createResource handle it
  }
})
```

### Using ErrorBoundary

For anticipated errors, wrap `createResource` usage in an ErrorBoundary:

```javascript
import { ErrorBoundary } from 'solid-js'

<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <MyComponentWithResource />
</ErrorBoundary>
```

## Loading States with Suspense

For managing multiple async operations, use Suspense:

```javascript
import { Suspense } from 'solid-js'

<Suspense fallback={<div>Loading...</div>}>
  <ComponentWithResource />
  <AnotherComponentWithResource />
</Suspense>
```

## Advanced Patterns

### Conditional Fetching

```javascript
const [shouldFetch, setShouldFetch] = createSignal(false)
const [data] = createResource(shouldFetch, async (fetch) => {
  if (!fetch) return null
  return await fetchData()
})
```

### Optimistic Updates with Mutate

```javascript
const [todos, { mutate }] = createResource(fetchTodos)

const addTodo = async (newTodo) => {
  // Optimistic update
  mutate(prev => [...(prev || []), newTodo])
  
  try {
    await postTodo(newTodo)
  } catch (error) {
    // Revert on error
    mutate(prev => prev?.slice(0, -1))
    throw error
  }
}
```

### Manual Refetch

```javascript
const [data, { refetch }] = createResource(fetchData)

const handleRefresh = () => {
  refetch() // Manually reload data
}
```

## Common Pitfalls to Avoid

1. **Data Fetching Waterfalls**: Avoid fetching inside deeply nested components
2. **Not Handling Empty States**: Always handle cases where data might be null or empty
3. **Improper Error Boundaries**: Don't forget to wrap components that might error
4. **Ignoring Loading States**: Always provide feedback during loading

## Performance Tips

1. **Hoist Data Fetching**: Move data fetching to the top of the component tree when possible
2. **Use Suspense Wisely**: Group related async operations under the same Suspense boundary
3. **Leverage SSR**: In SolidStart, resources are fetched on the server for better performance
4. **Cache Appropriately**: Use the built-in caching behavior by keeping source signals stable

## Integration with TypeScript

```typescript
interface User {
  id: number
  name: string
  email: string
}

const [userId, setUserId] = createSignal<number>()
const [user] = createResource<User | null, number>(
  userId, 
  async (id): Promise<User> => {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  }
)
```

## Conclusion

`createResource` provides a powerful, reactive way to handle data fetching in SolidJS applications. By following these patterns and best practices, you can create responsive, error-resilient applications that provide excellent user experience.