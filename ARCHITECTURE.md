# Bonarr - TV Show Manager Architecture

## Overview

Bonarr is a modern web application for managing TV show downloads and organization. It serves as a bridge between media metadata (via TMDB), torrent searching (via Prowlarr/AnimeBytes), and download management (via Transmission), providing an automated way to download, organize, and rename TV show episodes into a media library structure that Jellyfin expects.

## Core Purpose

Bonarr automates the TV show acquisition workflow:

1. **Search** for TV shows using TMDB metadata
2. **Browse** seasons and episodes with detailed information
3. **Find torrents** using Prowlarr or AnimeBytes APIs
4. **Download torrents** via Transmission
5. **Match episodes** to downloaded files using intelligent pattern matching
6. **Organize files** into a structured media library with proper naming conventions

## Technology Stack

### Frontend Framework

- **SolidJS** - Reactive frontend framework with fine-grained reactivity
- **SolidJS Start** - Full-stack meta-framework for SolidJS
- **SUID** (Solid UI) - Material Design components for SolidJS
- **TypeScript** - Type-safe development

### Build & Development

- **Vite** - Fast development server and build tool
- **Vinxi** - Build orchestration for SolidJS Start
- **OpenAPI TypeScript** - Generates types from API specifications

### External Integrations

- **TMDB API** - Movie/TV show metadata and images
- **Prowlarr API** - Torrent indexer aggregation
- **AnimeBytes API** - Specialized anime torrent tracker
- **Transmission RPC** - Torrent client control

### Deployment

- **Docker** - Containerized deployment with multi-stage builds
- **Node.js** - Runtime environment

## Architecture Overview

### Frontend Architecture (SolidJS)

```
src/
├── app.tsx                 # Root application component
├── routes/                 # File-based routing
│   ├── index.tsx          # Home page (TV show search)
│   └── show/[id]/         # TV show details and navigation
│       ├── index.tsx      # Show overview
│       └── season/[seasonNumber]/
│           ├── index.tsx           # Season details
│           ├── search.tsx          # Torrent search
│           ├── animebytes.tsx      # AnimeBytes search
│           └── torrents/
│               ├── index.tsx       # Downloaded torrents list
│               └── [torrentId]/
│                   ├── index.tsx   # Torrent file browser
│                   └── match.tsx   # Episode matching interface
├── components/            # Reusable UI components
├── api/                   # External API clients
├── queries/               # Solid.js queries for data fetching (currently only server-side ones)
└── types/                 # Generated TypeScript types
```

### Key Components

#### Search & Discovery

- **TVShowSearch** - Search TMDB for TV shows
- **TVShowDetail** - Display show information with seasons
- **SeasonDetail** - Show episodes and available torrents

#### Torrent Management

- **TorrentSearch** - Search torrents via Prowlarr
- **AnimeBytesSearch** - Search AnimeBytes tracker
- **TorrentsList** - Display downloaded torrents
- **TorrentFiles** - Browse files within a torrent

#### Episode Matching

- **EpisodeTorrentMatcher** - Core component for matching episodes to files
- **FileSelectionModal** - Manual file selection interface

### API Integration Layer

#### TMDB Client (`api/tmdb.ts`)

- Typed API client using OpenAPI specifications
- Handles authentication with Bearer tokens
- Provides functions for:
  - TV show search
  - Show details retrieval
  - Season/episode information

#### Prowlarr Client (`api/prowlarr.ts`)

- Integrates with Prowlarr for torrent searching
- Filters results to TV categories only
- Handles API key authentication

#### Transmission Client (`api/transmission.ts`)

- RPC client for Transmission torrent management
- Capabilities:
  - Add torrents via magnet links or files
  - Retrieve torrent status and file listings
  - File priority and selection management

#### AnimeBytes API (`queries/animebytes-api.ts`)

- Specialized client for AnimeBytes private tracker
- Server-side only to protect credentials
- Advanced search with metadata parsing

### Business Logic Layer

#### Episode Matching Algorithm (`queries/applyMatches.ts`)

The core intelligence of Bonarr lies in automatically matching TV show episodes to downloaded torrent files:

**Pattern Recognition:**

- `S01E05` format (standard)
- `Season 1 Episode 5` format
- `1x05` format
- Episode number only patterns
- Confidence scoring (high/medium/low/none)

**File Organization:**

- Creates structured directory: `Show Name [tmdbid-123]/Season 01/`
- Standardized naming: `Show Name - S01E05.mkv`
- Hard links preserve original files while organizing library
- Handles existing file detection and replacement

**Confidence Levels:**

- **High:** Exact season/episode pattern matches
- **Medium:** Episode number with less specific context
- **Low:** Weak pattern matches requiring review
- **None:** No automatic match found

### State Management

Bonarr uses SolidJS's reactive primitives for state management:

- **createResource** - For async data fetching with loading/error states
- **createSignal** - For local component state
- **Query functions** - Server-side data fetching with type safety

### Routing Structure

File-based routing creates a logical navigation hierarchy:

```
/                                    # TV show search
/show/[id]                          # Show details
/show/[id]/season/[seasonNumber]    # Season overview
/show/[id]/season/[seasonNumber]/search         # Torrent search
/show/[id]/season/[seasonNumber]/animebytes     # AnimeBytes search
/show/[id]/season/[seasonNumber]/torrents       # Downloaded torrents
/show/[id]/season/[seasonNumber]/torrents/[id]  # Torrent files
/show/[id]/season/[seasonNumber]/torrents/[id]/match  # Episode matching
```

## Workflow

### Typical User Flow

1. **Search for TV Show**
   - User searches TMDB for a TV show
   - Results show poster, rating, description
   - Click to view show details

2. **Browse Show & Season**
   - View show overview with all seasons
   - Select specific season to manage
   - See episode list with air dates and descriptions

3. **Find Torrents**
   - Search Prowlarr or AnimeBytes for season torrents
   - View torrent details (size, seeders, files)
   - Download preferred torrent to Transmission

4. **Match Episodes**
   - Automatic pattern matching attempts to link episodes to files
   - Review and correct matches manually if needed
   - Apply matches to create organized library structure

5. **Library Organization**
   - Files are hard-linked into structured directories
   - Standard naming convention for media server compatibility
   - Original torrent files remain untouched for seeding

### Integration Points

**Prowlarr Integration:**

- Aggregates multiple torrent indexers
- Provides unified search interface
- Returns standardized torrent metadata

**AnimeBytes Integration:**

- Specialized for anime content
- Higher quality metadata and releases
- Requires private tracker credentials

**Transmission Integration:**

- Remote torrent management
- File listing and selection
- Download progress monitoring

**TMDB Integration:**

- Authoritative TV show metadata
- High-quality artwork and descriptions
- Episode information and air dates

## Configuration

### Environment Variables

```bash
# TMDB API (Required)
VITE_TMDB_API_KEY=your_tmdb_api_key

# Prowlarr API (Required)
VITE_PROWLARR_BASE_URL=http://localhost:9696
VITE_PROWLARR_API_KEY=your_prowlarr_api_key

# Transmission (Required)
VITE_TRANSMISSION_URL=http://localhost:9091/transmission/rpc
VITE_TRANSMISSION_USERNAME=username  # Optional
VITE_TRANSMISSION_PASSWORD=password  # Optional

# AnimeBytes (Optional)
VITE_ANIMEBYTES_USERNAME=username
VITE_ANIMEBYTES_PASSKEY=passkey

# Download Management (Runtime)
TORRENT_FILTER_PATH=/path/to/downloads
VITE_LIBRARY_ROOT=/path/to/media/library
```

### Docker Deployment

Multi-stage Docker build optimizes for production:

- Development dependencies separated from runtime
- OpenAPI type generation during build
- PUID/PGID support for file permissions
- Health checks and proper signal handling

## Design Patterns

### Reactive Data Flow

- Resources automatically refetch when dependencies change
- Loading and error states handled declaratively
- Optimistic updates for better UX

### Type Safety

- OpenAPI schema generates exact API types
- Full TypeScript coverage prevents runtime errors
- Compile-time validation of API calls

### Component Composition

- Shared layout components for consistent UI
- Modal dialogs for complex interactions
- Responsive design with mobile-first approach

### Error Handling

- Graceful degradation when services unavailable
- User-friendly error messages
- Retry mechanisms for transient failures

## Development Guidelines

### Code Organization

- Strict separation of concerns (UI, API, business logic)
- Reusable utility functions in `/queries`
- Generated types never manually edited
- Consistent file naming and structure

### Performance Considerations

- SolidJS fine-grained reactivity minimizes re-renders
- Server-side API calls protect sensitive credentials
- Efficient torrent file processing
- Debounced search to prevent excessive API calls

### Security

- API keys never exposed to client
- Server-side AnimeBytes integration
- CORS and authentication handled by external services
- No direct file system access from frontend

This architecture enables Bonarr to be a powerful, type-safe, and maintainable TV show management solution that bridges the gap between torrent discovery and organized media libraries.
