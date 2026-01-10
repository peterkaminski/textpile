# Textpile Routes Documentation

## Overview

Textpile is a Cloudflare Pages application with a serverless backend using Cloudflare Workers and KV storage. The application provides a simple platform for sharing long-form text posts with configurable retention periods.

---

## Public Routes

### Static Pages (HTML)

These are served directly from the `/public` directory:

- **`/` (index.html)** - Homepage displaying the list of recent posts
- **`/about` (about.html)** - About page with information about the Textpile instance
- **`/add` (add.html)** - Form for adding new posts
- **`/admin` (admin.html)** - Admin dashboard for managing posts (requires ADMIN_TOKEN)
- **`/test-date-formatter` (test-date-formatter.html)** - Testing page for date formatting utilities

### API Routes

#### **GET `/api`**
- **File**: `functions/api/index.js`
- **Purpose**: Retrieve the index of all active posts
- **Authentication**: None
- **Response**: JSON array of post metadata (id, title, createdAt, expiresAt, pinned, url)
- **Features**:
  - Filters out expired posts automatically
  - Sorts pinned posts first, then by creation date (newest first)
  - Cleans up expired entries from the index

#### **POST `/api/add`**
- **File**: `functions/api/add.js`
- **Purpose**: Add a new post
- **Authentication**: Optional ADD_POST_PASSWORD (if configured)
- **Request Body**:
  ```json
  {
    "token": "optional_add_post_password",
    "title": "Post title (max 140 chars)",
    "body": "Post content (required)",
    "expiry": "1week|1month|3months|6months|1year",
    "pinned": false
  }
  ```
- **Response**: JSON with success status, post ID, and URL
- **Features**:
  - Validates post size against MAX_POST_SIZE (default 1MB)
  - Allocates unique post ID using KV-based claim/verify protocol
  - Sets automatic expiration based on retention period
  - Updates the index with the new post

#### **POST `/api/remove`**
- **File**: `functions/api/remove.js`
- **Purpose**: Remove a specific post
- **Authentication**: Required ADMIN_TOKEN
- **Request Body**:
  ```json
  {
    "token": "admin_token",
    "id": "post_id"
  }
  ```
- **Response**: JSON with success status
- **Features**:
  - Deletes post from KV storage
  - Removes post from index
  - Cleans up expired entries during index update

#### **GET `/api/config`**
- **File**: `functions/api/config.js`
- **Purpose**: Retrieve public configuration variables
- **Authentication**: None
- **Response**: JSON with configuration settings
- **Returned Config**:
  - `instanceName`: Name of the Textpile instance
  - `communityName`: Name of the community
  - `adminEmail`: Contact email (if configured)
  - `defaultRetention`: Default retention period
  - `dateFormat`: ICU date format string
  - `timeFormat`: ICU time format string
  - `textpileVersion`: Current version number
- **Cache**: 5 minutes

---

## Admin Routes

All admin routes require authentication via `Authorization: Bearer <ADMIN_TOKEN>` header or token in request body.

#### **GET `/api/admin/posts`**
- **File**: `functions/api/admin/posts.js`
- **Purpose**: List all posts with metadata
- **Authentication**: Required ADMIN_TOKEN (Authorization header)
- **Response**: JSON array of all posts with full metadata
- **Includes**: id, title, createdAt, expiresAt, pinned, size, url

#### **GET `/api/admin/stats`**
- **File**: `functions/api/admin/stats.js`
- **Purpose**: Get storage statistics
- **Authentication**: Required ADMIN_TOKEN (Authorization header)
- **Response**: JSON with storage statistics
- **Stats Provided**:
  - Total number of posts
  - Estimated storage size
  - Index size
  - Maximum KV size limit
  - Percentage used
  - Warning/critical flags

#### **POST `/api/admin/pin`**
- **File**: `functions/api/admin/pin.js`
- **Purpose**: Pin or unpin a post
- **Authentication**: Required ADMIN_TOKEN (in request body)
- **Request Body**:
  ```json
  {
    "token": "admin_token",
    "id": "post_id",
    "pinned": true
  }
  ```
- **Response**: JSON with success status
- **Features**:
  - Updates post metadata
  - Preserves remaining TTL
  - Re-sorts index to place pinned posts first

#### **POST `/api/admin/clear`**
- **File**: `functions/api/admin/clear.js`
- **Purpose**: Delete all posts
- **Authentication**: Required ADMIN_TOKEN (Authorization header)
- **Response**: JSON with success status and count of deleted posts
- **Warning**: This is a destructive operation with no undo

#### **GET `/api/admin/export`**
- **File**: `functions/api/admin/export.js`
- **Purpose**: Export all posts as JSONL
- **Authentication**: Required ADMIN_TOKEN (Authorization header)
- **Response**: JSONL file download
- **Format**: One JSON object per line with id, title, body, createdAt, expiresAt, pinned

#### **POST `/api/admin/import`**
- **File**: `functions/api/admin/import.js`
- **Purpose**: Import posts from JSONL file
- **Authentication**: Required ADMIN_TOKEN (Authorization header)
- **Request Body**: JSONL content (plain text)
- **Response**: JSON with import statistics and any errors
- **Features**:
  - Validates each line
  - Calculates appropriate TTL for each post
  - Rebuilds the index after import

---

## Dynamic Routes

#### **GET `/p/[id]`**
- **File**: `functions/p/[id].js`
- **Purpose**: Display a specific post
- **Authentication**: None
- **Features**:
  - Retrieves post content and metadata from KV
  - Checks if post has expired (returns 410 Gone if expired)
  - Renders post with Markdown formatting (client-side using marked.js)
  - Provides toggle between formatted and plain text view
  - Includes copy text and copy URL buttons
  - Uses configurable date/time formatting

#### **GET `/feed.xml`**
- **File**: `functions/feed.xml.js`
- **Purpose**: RSS feed of recent posts
- **Authentication**: None
- **Response**: RSS 2.0 XML feed
- **Features**:
  - Returns up to 50 most recent active posts
  - Filters out expired posts
  - Includes title, link, GUID, publication date
  - Cache: 5 minutes

---

## Route Summary Table

| Route | Method | Type | Auth Required | Purpose |
|-------|--------|------|---------------|---------|
| `/` | GET | Static | No | Homepage |
| `/about` | GET | Static | No | About page |
| `/add` | GET | Static | No | Add post form |
| `/admin` | GET | Static | Yes (client-side) | Admin dashboard |
| `/api` | GET | API | No | Get post index |
| `/api/add` | POST | API | Optional | Add new post |
| `/api/remove` | POST | API | Yes | Remove a post |
| `/api/config` | GET | API | No | Get public config |
| `/api/admin/posts` | GET | API | Yes | List all posts |
| `/api/admin/stats` | GET | API | Yes | Get statistics |
| `/api/admin/pin` | POST | API | Yes | Pin/unpin post |
| `/api/admin/clear` | POST | API | Yes | Delete all posts |
| `/api/admin/export` | GET | API | Yes | Export as JSONL |
| `/api/admin/import` | POST | API | Yes | Import from JSONL |
| `/p/[id]` | GET | Dynamic | No | View specific post |
| `/feed.xml` | GET | Dynamic | No | RSS feed |

---

## Authentication Methods

### ADD_POST_PASSWORD ("Add Post Password")
- Used for `/api/add` endpoint
- If configured, required to add new posts
- Provided in request body as `token` field
- Uses timing-safe comparison to prevent timing attacks

### ADMIN_TOKEN (Required for admin routes)
- Used for all `/api/admin/*` and `/api/remove` endpoints
- Can be provided via:
  - `Authorization: Bearer <token>` header (for GET requests)
  - Request body `token` field (for POST requests)
- Uses timing-safe comparison to prevent timing attacks

---

## Key Features

### Post Expiration
- All posts have configurable retention periods (1 week to 1 year)
- Expired posts are automatically filtered from the index
- Accessing an expired post returns a 410 Gone status
- KV automatically deletes expired posts based on TTL

### Post Pinning
- Posts can be pinned to appear at the top of the index
- Pinned posts are sorted first, then by creation date
- Pin status is stored in post metadata

### ID Allocation
- Uses a KV-based claim/verify protocol to ensure unique IDs
- Prevents race conditions during concurrent post creation
- Includes verification step to detect ID conflicts

### Security
- Timing-safe token comparison prevents timing attacks
- No user identity or authentication beyond tokens
- Post size limits prevent abuse
- Admin operations require explicit token authentication
