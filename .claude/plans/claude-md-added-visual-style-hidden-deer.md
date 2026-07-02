# Admin: Dialogs on Dashboard + Remove Difficulty

## Context

The user wants:
1. Add-video and edit-video to be dialogs on the dashboard, not separate pages
2. Remove the "difficulty" concept from the admin UI entirely

## Changes

### 1. Remove difficulty from admin UI

- **Dashboard table** (`video-table.tsx`): drop the `Difficulty` column
- **Edit form** (new dialog): no difficulty field
- **Add-video dialog** (new): no difficulty field (it wasn't there before either)
- The database column stays — we just don't show or edit it in the admin

### 2. Dashboard becomes the single admin hub

**New client component** `dashboard-content.tsx`:
- Wraps the stats, category bar, video table, and the two dialogs
- Manages dialog open/close state and which video is being edited
- Called by the server page after auth + data fetch

**Add-video dialog** (`add-video-dialog.tsx`):
- Same fields as the current `/admin/add-video`: YouTube URL (required) + category name (optional text input)
- POST to `/api/admin/ingest` on submit
- On success: close dialog, refresh the page
- Uses shadcn `Dialog`, `Input`, `Button`

**Edit-video dialog** (`edit-video-dialog.tsx`):
- Wide dialog (`max-w-2xl` or `max-w-3xl` with scroll) containing the full edit form
- Fields: title, slug, status (select), category (select + custom), summary (textarea), takeaways (list with add/remove), chapters (list with add/remove)
- Actions: Save, Regenerate AI, Delete (with confirmation)
- PATCH to `/api/admin/videos/[id]` on save
- On save/delete: close dialog, refresh the page
- Reuses the same form logic from the existing edit-form component

**Video-table** (`video-table.tsx`):
- Remove the `Difficulty` column + header
- Edit button calls `onEdit(video)` instead of `router.push(...)`
- Accept `onEdit: (video: VideoRow) => void` prop

### 3. Files involved

| File | Action |
|---|---|
| `src/app/admin/dashboard/page.tsx` | Pass data to `DashboardContent` instead of rendering inline |
| `src/app/admin/dashboard/video-table.tsx` | Remove difficulty column, accept `onEdit` callback |
| `src/app/admin/dashboard/dashboard-content.tsx` | **New** — client wrapper managing dialogs |
| `src/app/admin/dashboard/add-video-dialog.tsx` | **New** — add video dialog form |
| `src/app/admin/dashboard/edit-video-dialog.tsx` | **New** — edit video dialog form |

### 4. What stays

- `/admin/add-video` page — still works at its direct URL
- `/admin/edit/[id]` page — still works at its direct URL
- All API routes — unchanged
- The database `difficulty` column — unchanged, just hidden from UI

## Verification

1. `/admin/dashboard` shows the same stats + table as before, but without the Difficulty column
2. Click "Add Video" button → dialog opens, can paste URL + category, ingest works
3. Click Edit icon on a row → wide dialog opens with all fields pre-populated
4. Edit a field, save → dialog closes, table refreshes with updated data
5. Delete from edit dialog → confirmation → video gone
6. Regenerate AI from edit dialog → works
7. The separate `/admin/add-video` and `/admin/edit/[id]` pages still work via direct URL
