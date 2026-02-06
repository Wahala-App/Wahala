# Features Added Today

This document outlines all the features and improvements added to the Wahala incident reporting platform.

## 🎯 Major Features

### 1. Live Updates System
**Location**: `app/incident/[id]/page.tsx`, `app/api/updates/route.ts`

A complete live updates system that allows users to post real-time updates on incidents with severity ratings and media attachments.

#### Features:
- **Post Updates**: Users can add live updates to any incident with text, severity rating (1-10), and optional images
- **Severity Input**: Interactive slider (1-10) with color-coded labels (Low/Medium/High/Critical)
- **Image Upload**: 
  - Click paperclip icon to attach images
  - Image preview before posting
  - Automatic upload to S3
  - Support for common image formats (jpg, png, webp)
  - 5MB file size limit
- **Dynamic Severity Calculation**: 
  - Time-decay weighted average (recent updates weighted more heavily)
  - Original incident severity gets 40% weight
  - Updates from last hour: 100% weight
  - Updates from 1-6 hours: 70% weight
  - Updates from 6-24 hours: 40% weight
  - Updates older than 24 hours: 10% weight
- **Real-time Updates**: Updates are fetched from database and displayed in chronological order
- **Update Counter**: Shows number of live updates on incident cards and popovers
- **Updates API**: Dedicated endpoint for posting/fetching live updates (`/api/updates`)

#### Database:
- New `incident_updates` table stores all update data
- Automatic `update_count` tracking on incidents
- Foreign key relationships for data integrity

#### API Endpoints:
- `GET /api/updates?incident_id={id}` - Retrieve all updates for an incident
- `POST /api/updates` - Create a new update

---

### 2. Location Recalibration System
**Location**: `app/home/home.tsx`, `app/home/UserOval.tsx`, `app/map/map.tsx`

Enhanced location management with automatic fetching and manual recalibration.

#### Features:
- **Automatic Location Fetching**: 
  - Fetches user's current location on page load (if not stored)
  - Converts coordinates to readable addresses using reverse geocoding
  - Caches addresses to reduce API calls
- **Recalibrate Button**: 
  - Located in profile dropdown menu
  - Fetches fresh location and updates displayed address
  - Centers map on user's current location
- **Star Button**: 
  - Floating button on map (bottom-right)
  - Quickly centers map on user's current location
  - Uses high-accuracy GPS when available
- **Address Caching**: 
  - In-memory cache for frequently accessed coordinates
  - Reduces geocoding API calls
  - Cache key: `"lat,lng"` (rounded to 4 decimals)

#### Error Handling:
- Graceful fallback to coordinates if geocoding fails
- Clear error messages for permission denied, timeout, etc.
- Fallback location (Statesboro, GA) if geolocation unavailable

---

### 3. Evidence Image Display & Fullscreen Viewer
**Location**: `app/ui/IncidentDetailsPopover.tsx`, `app/incident/[id]/page.tsx`

Enhanced evidence image viewing with secure presigned URLs and fullscreen modal.

#### Features:
- **Secure Image Access**: 
  - Uses presigned S3 URLs for viewing evidence images
  - Temporary URLs (1 hour expiration) for security
  - API endpoint: `GET /api/getImageUrl?url={s3Url}`
- **Clickable Images**: 
  - Click any evidence image to view fullscreen
  - Fullscreen modal with backdrop blur
  - Close with ESC key, click outside, or close button
  - Prevents body scroll when modal is open
- **Loading States**: 
  - Shows "Loading image..." while fetching presigned URL
  - Error state if image fails to load
- **Image Preview in Updates**: 
  - Live updates can include images
  - Images displayed inline with updates
  - Clickable for fullscreen view

---

### 4. Theme Toggle (Light / Dark / System)
**Location**: `app/globals.css`, `app/layout.tsx`, `src/contexts/ThemeContext.tsx`, `app/home/home.tsx`, `app/home/UserOval.tsx`

Added an app-wide theme system that matches mobile behavior and supports Light/Dark/System.

#### Features:
- **App-wide theming**: Uses CSS variables already powering `bg-background` / `text-foreground`
- **Three modes**:
  - Light
  - Dark
  - System (follows device theme)
- **Persistence**: saves selection in `localStorage` (`themeChoice`)
- **No flash on load**: pre-hydration script applies the saved theme before React renders
- **UI access points**:
  - Mobile Profile screen (`ProfileOverlay`)
  - Desktop profile dropdown (`UserOval`)

---

### 5. Desktop UI Redesign
**Location**: `app/home/SearchAndAdd.tsx`, `app/home/UserOval.tsx`, `app/ui/IncidentDisplay.tsx`

Complete redesign of desktop sidebar and navigation to match mobile-first design.

#### Features:
- **Tabbed Sidebar**:
  - **Home Tab**: Welcome message, trending alerts, recent incidents
  - **Reports Tab**: Searchable incident list with category filters
  - **Alerts Tab**: List of recent alerts with modern card styling
- **Top Navigation Bar**:
  - User profile pill with avatar, name, and reputation status
  - Alerts bell with notification badge (now wired to open Alerts)
  - Enhanced dropdown menu with:
    - User information section
    - Reputation display with shield icons
    - Current location with recalibrate button
    - Sign out action
- **Incident Cards**:
  - Modern card design with rounded corners
  - Type-colored icons
  - Live updates counter with pulsing eye icon
  - Improved typography and spacing
- **Popover Positioning**:
  - Centered on desktop screens
  - Bottom sheet on mobile
  - Better visibility and accessibility

---

### 6. SOS (Emergency Alert) System
**Location**: `app/ui/SOSButton.tsx`, `app/api/sos/route.ts`, `app/api/sos/events/route.ts`, `app/api/sos/recipients/route.ts`, `app/actions/sos.ts`, `app/ui/SOSRecipientsSection.tsx`, `app/utils/sosNotifier.ts`, `migrations/create_sos_tables.sql`

Emergency SOS alert system for users in distress.

#### Features:
- **SOS Button**: Floating red button (mobile: bottom-right; alarm clock icon) to trigger an emergency alert.
- **One-tap SOS**: Sends current GPS location to the server; creates an `sos_events` record.
- **SOS Recipients**: Users can add trusted contacts (email) to receive notifications when they trigger SOS.
- **SOS Events API**: `POST /api/sos` creates an event; `GET /api/sos/events` fetches events for display.
- **Alerts Integration**: SOS events appear in the Alerts tab and Latest Alerts section alongside incidents.
- **Map Integration**: SOS events can be displayed as markers on the map (when user taps "View Details").
- **Recipient Notifications**: `sosNotifier` sends emails to configured recipients when SOS is triggered.

#### Database:
- `sos_events`: Stores each SOS trigger (sender_uid, latitude, longitude, description, created_at).
- `sos_recipients`: Stores which emails receive SOS alerts per user.

#### API Endpoints:
- `POST /api/sos` - Create SOS event (latitude, longitude)
- `GET /api/sos/events` - Retrieve SOS events
- `GET /api/sos/recipients` - Get user's SOS recipients
- `POST /api/sos/recipients` - Add SOS recipient
- `DELETE /api/sos/recipients` - Remove SOS recipient

---

### 7. UI/UX Improvements

#### Text Contrast Fixes
- Improved text contrast in profile dropdown
- Better readability in dark mode
- Updated opacity values for labels and secondary text

#### Theme Toggle (Light / Dark / System)
**Location**: `app/globals.css`, `app/layout.tsx`, `src/contexts/ThemeContext.tsx`, `app/home/home.tsx`, `app/home/UserOval.tsx`

- Added **Light / Dark / System** theme selection (like mobile)
- Theme applies **app-wide** using CSS variables (`bg-background`, `text-foreground`)
- Persists user choice in `localStorage` (`themeChoice`)
- Applies saved theme before React renders (pre-hydration script) to avoid “flash”
- UI toggles available in:
  - Mobile **Profile** screen (`ProfileOverlay`)
  - Desktop **User** dropdown (`UserOval`)

#### Incident Details Popover
- Added live update counter with pulsing eye icon
- Better positioning on desktop (centered)
- Consistent styling with rest of application

#### Alerts Bell (Option A / MVP)
**Location**: `app/home/home.tsx`, `app/home/UserOval.tsx`, `app/home/SearchAndAdd.tsx`

- **Click behavior**:
  - Desktop: switches the sidebar (`SearchAndAdd`) to the **Alerts** tab
  - Mobile: navigates to the **Alerts** overlay/tab
- **Unread badge**:
  - Stored per-device in `localStorage`
  - Unread = new incidents since last seen + `update_count` deltas since last seen
  - Viewing Alerts marks them as read

#### Light Mode Popover Button Visibility
- Fixed “View full report” button disappearing in **Light mode**
- Updated `IncidentDetailsPopover` styling to use theme tokens (`bg-background`, `text-foreground`) instead of mixed `bg-white` + `dark:*` classes

#### Severity Indicator
- Pill-style severity indicator matching report popup design
- Color-coded labels (Low/Medium/High/Critical)
- Consistent across incident page and popovers

#### Input Field Styling
- Fixed text color in input fields (was showing black)
- Theme-aware text colors (light in dark mode, dark in light mode)
- Proper placeholder styling

---

## 🔧 Technical Improvements

### Database Schema
- New `incident_updates` table with proper relationships
- Indexes for efficient queries
- Automatic update count tracking
- Helper function for atomic update count increments

### API Enhancements
- New updates API endpoint with full CRUD operations
- Improved error handling and validation
- Authentication checks on all endpoints
- Presigned URL generation for secure S3 access

### State Management
- Proper loading states for async operations
- Error state handling with user-friendly messages
- Optimistic updates for better UX
- useCallback for performance optimization

### Code Organization
- Centralized utility functions (`app/utils/incidentUtils.ts`)
- Address caching utility (`app/utils/addressCache.ts`)
- Type definitions in `app/api/types.ts`
- Consistent error handling patterns

---

## 📁 New Files Created

1. `app/api/updates/route.ts` - Updates API endpoint
2. `app/utils/incidentUtils.ts` - Shared incident utility functions
3. `app/utils/addressCache.ts` - Address caching utility
4. `app/api/getImageUrl/route.ts` - Presigned URL generation endpoint
5. `migrations/create_incident_updates_table.sql` - Database migration script
6. `app/api/sos/route.ts` - SOS event creation endpoint
7. `app/api/sos/events/route.ts` - SOS events fetch endpoint
8. `app/api/sos/recipients/route.ts` - SOS recipients CRUD
9. `app/ui/SOSButton.tsx` - Emergency SOS button component
10. `app/ui/SOSRecipientsSection.tsx` - Manage SOS notification recipients
11. `app/utils/sosNotifier.ts` - Email notification for SOS recipients
12. `migrations/create_sos_tables.sql` - SOS database migration

---

## 🔄 Modified Files

1. `app/incident/[id]/page.tsx` - Complete live updates implementation
2. `app/home/home.tsx` - Location fetching, recalibration, and Alerts bell behavior
3. `app/home/UserOval.tsx` - Enhanced profile dropdown with location + theme toggle + alerts click
4. `app/home/SearchAndAdd.tsx` - Tabbed sidebar interface
5. `app/ui/IncidentDisplay.tsx` - Modern card design with live updates counter
6. `app/ui/IncidentDetailsPopover.tsx` - Evidence display, live updates counter, and theme-consistent styling
7. `app/ui/TextInput.tsx` - Fixed text color issues
8. `app/map/map.tsx` - Enhanced location recalibration
9. `app/map/mapUtils.tsx` - Improved geolocation with better error handling
10. `app/actions/dataHandler.ts` - New update-related database functions
11. `app/api/types.ts` - Added IncidentUpdate type
12. `app/actions/uploadFile.ts` - Added presigned view URL function
13. `app/globals.css` - Added live-pulse animation for live updates eye icon
14. `app/layout.tsx` - Added ThemeProvider wrapper + pre-hydration theme script
15. `src/contexts/ThemeContext.tsx` - New global theme context/provider
16. `app/api/updates/route.ts` - New API endpoint for incident live updates

---

## 🎨 Design Improvements

- Consistent color scheme across all components
- Better spacing and typography
- Improved accessibility with proper contrast ratios
- Responsive design maintained across mobile and desktop
- Smooth animations and transitions
- Loading indicators for better user feedback

---

## 🐛 Bug Fixes

1. **Text Color in Inputs**: Fixed black text appearing in input fields
2. **Popover Positioning**: Fixed incident details popover being too low on desktop
3. **Icon Issues**: Replaced comment icon with pulsing eye icon for live updates
4. **Location Display**: Fixed location not updating when recalibrating
5. **Image Loading**: Fixed evidence images not loading (now using presigned URLs)
6. **Severity Calculation**: Fixed hardcoded severity values in updates

---

## 📝 Database Migration Required

Before using the live updates feature, run the SQL migration:

```bash
# Run this in your Supabase SQL editor
# File: migrations/create_incident_updates_table.sql
```

This creates:
- `incident_updates` table
- Indexes for performance
- `update_count` column on `location_pins` table
- Helper function for atomic updates

---

## 🚀 Usage Examples

### Posting a Live Update
1. Navigate to an incident detail page
2. Adjust severity slider (1-10)
3. (Optional) Click paperclip to attach an image
4. Type your update message
5. Click send button

### Recalibrating Location
1. Click profile icon in top-right
2. Click "Recalibrate" button in Current Location section
3. Map will center on your current location
4. Address will update automatically

### Viewing Evidence Images
1. Click on any evidence image in incident details
2. Image opens in fullscreen modal
3. Press ESC or click outside to close

---

## 🔐 Security Features

- All API endpoints require authentication
- Presigned URLs for secure S3 access (temporary, expiring)
- Input validation on all user inputs
- File type and size validation for uploads
- SQL injection prevention through parameterized queries

---

## 📊 Performance Optimizations

- Address caching to reduce API calls
- Indexed database queries
- Optimistic UI updates
- Lazy loading of images
- Efficient state management with useCallback

---

## 🧪 Testing Recommendations

1. Test image upload with various formats (jpg, png, webp)
2. Test file size limits (5MB max)
3. Test severity input range (1-10)
4. Test posting updates with and without images
5. Test location recalibration with different permission states
6. Test severity calculation with multiple updates
7. Test error handling (network failures, invalid data)
8. Test with multiple users posting updates to same incident

---

## 📚 Related Documentation

- See `DEPLOYMENT.md` for deployment considerations
- See `migrations/create_incident_updates_table.sql` for database schema
- See individual component files for detailed implementation

---

## 🎯 Future Enhancements (Not Implemented)

- Real-time updates via WebSockets
- User reputation system for weighted severity
- Location-based update permissions
- Update moderation features
- Push notifications for new updates

---

## ✅ Additions & Fixes (February 2, 2026)

### 1) Disprove (parallel to Live Updates)
**Location**: `app/incident/[id]/IncidentFeedContent.tsx`, `app/api/updates/route.ts`, `app/actions/dataHandler.ts`, `migrations/add_incident_updates_kind.sql`

- Added **Disprove** as an update type alongside normal live updates.
- **Moderation rules**:
  - Update authors can delete **their own** updates/disproves.
  - Pin creator can delete **normal live updates only** (cannot delete disproves).
- Added **delete confirmation modal** before deleting an update/disprove.
- Added `incident_updates.kind` (`update | disprove`) and `decrement_update_count()` for correct count maintenance.

### 2) Severity-based media requirements + video support
**Location**: `app/ui/IncidentDialog.tsx`, `app/report/create/page.tsx`, `app/incident/[id]/IncidentFeedContent.tsx`, `app/utils/mediaRequirements.ts`

- **Incident creation evidence is now required** based on severity:
  - Severity **≤ 5**: requires **picture** (max **4MB**)
  - Severity **> 5**: requires **video** (max **50MB**)
- **Live update/disprove media is now required** based on severity:
  - Severity **≤ 5**: requires **picture** (max **5MB**)
  - Severity **> 5**: requires **video** (max **50MB**)
- Added user-facing **popup modal** blocking submit when requirements aren’t met.
- Added **video support** for live updates: pick, preview, upload to S3, and render as `<video>`.

### 3) Backward-compatible media rendering (fallback)
**Location**: `app/incident/[id]/IncidentFeedContent.tsx`, `app/ui/IncidentDetailsPopover.tsx`, `app/utils/mediaRequirements.ts`

- Fixed old incidents/updates rendering as video incorrectly by **inferring media type from URL extension** (fallback to image), so previously uploaded images still render correctly even if severity is high.

### 4) Cache-first pins + persistent login (mobile-like)
**Location**: `app/actions/auth.ts`, `src/contexts/AuthContext.tsx`, `app/home/home.tsx`, `app/utils/authCache.ts`, `app/utils/pinsCache.ts`

- Auth now persists across browser restarts via Firebase **`browserLocalPersistence`** (mobile-like).
- Cached user profile in `localStorage` for fast startup; refreshes in background from `/api/user`.
- Cached pins list in `localStorage`:
  - Load cached pins instantly on startup, then refresh from `/api/dataHandler`.
  - Cache kept in sync on realtime pin INSERT/UPDATE/DELETE and manual delete.

### 5) UI fixes / polish
**Location**: `app/home/home.tsx`, `app/home/SearchAndAdd.tsx`, `app/incident/[id]/IncidentFeedContent.tsx`

- Replaced Home header info-circle with the **Wahala logo** and aligned it with the title.
- Fixed desktop “+ REPORT INCIDENT” button in sidebar: it now opens the **report modal** (previously navigated to a mobile-only page).
- Improved Disprove UI:
  - Toggle integrated into severity row (no separate line)
  - Disprove badge pill styled **green background + black text**

---

## Additions & Fixes (February 6, 2026)

### 1) Hashtag Subscription Feature
**Location**: `app/utils/hashtagSubscriptions.ts`, `app/ui/HashtagChips.tsx`, `app/ui/HashtagSubscriptionsSection.tsx`, `app/home/SearchAndAdd.tsx`, `app/home/home.tsx`, `app/ui/IncidentDetailsPopover.tsx`, `app/incident/[id]/IncidentFeedContent.tsx`, `app/ui/IncidentDialog.tsx`, `app/report/create/page.tsx`, `app/actions/dataHandler.ts`, `app/api/types.ts`, `migrations/add_hashtags_to_location_pins.sql`

- **Hashtag field on reports**: Users can add optional hashtags when creating an incident (comma- or space-separated, e.g. `#violence #election`).
- **Hashtag display**: Hashtags shown as chips on incident details (popover and full report page).
- **Subscribe from report details**: Tapping a hashtag on a report opens a confirmation dialog to subscribe.
- **Alerts page – Hashtag Subscriptions section**:
  - Type a hashtag to search; only hashtags that exist in reports are suggested.
  - Click a suggestion to subscribe.
  - Subscribed hashtags shown as chips (tap to unsubscribe).
- **Home page – Reports from your subscribed hashtags**:
  - New section above Trending Alerts / Recent Verified Alerts.
  - Shows reports matching the user’s subscribed hashtags.
  - Empty states: "Subscribe to hashtags in the Alerts tab..." or "No reports match your subscribed hashtags."
- **Storage**: Subscriptions stored in `localStorage` (`wahala_hashtag_subscriptions`).
- **Database**: Added `hashtags` column (`TEXT[]`) to `location_pins`.

### 2) Block Pin Creator from Disproving Own Post
**Location**: `app/actions/dataHandler.ts`, `app/api/updates/route.ts`, `app/incident/[id]/IncidentFeedContent.tsx`

- Pin creators can no longer post a **disprove** on their own incident.
- They can still post **live updates** with evidence.
- **Backend**: `storeIncidentUpdate` rejects disproves when `uid === creator_uid`; returns 403 for auth-type errors.
- **Frontend**: Disprove button hidden when the current user is the pin creator; `updateKind` resets to `"update"` when applicable.

### 3) View Full Report Button Fix
**Location**: `app/ui/IncidentDetailsPopover.tsx`

- Added `whitespace-nowrap` so "View full report" label stays on a single line instead of wrapping.

---

*Last Updated: February 6, 2026*
