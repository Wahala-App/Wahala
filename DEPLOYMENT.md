# Deployment Considerations

## Current Limitations on Vercel

### File System Storage
The current implementation uses a local JSON file for data storage. This has limitations when deployed to Vercel:

1. **Read-only file system**: Vercel serverless functions can't write to the file system persistently
2. **Function isolation**: Each serverless function invocation is isolated
3. **Cold starts**: Data stored in memory is lost between cold starts

### Current Workarounds
The API has been updated to handle these limitations:

1. **In-memory caching**: Incidents are cached in memory during function execution
2. **Graceful fallback**: If file operations fail, the app continues to work with default data
3. **Error handling**: File system errors are caught and logged as warnings

## Recommended Production Setup

For a production deployment, consider these improvements:

### 1. Database Integration
Replace the JSON file with a proper database:

```bash
# Install database client (example with Prisma + PostgreSQL)
npm install prisma @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init
```

### 2. Environment Variables
Set up proper environment variables in Vercel:

```bash
# In Vercel dashboard or CLI
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
```

### 3. Database Schema Example
```sql
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. API Route Updates
Update the API routes to use database queries instead of file operations:

```typescript
// Example with Prisma
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  const incidents = await prisma.incident.findMany();
  return NextResponse.json(incidents);
}
```

## Current Behavior on Vercel

### What Works:
- ✅ Map displays existing incidents from the JSON file
- ✅ New incidents appear on the map immediately
- ✅ Icons update correctly on the map

### What Has Limitations:
- ⚠️ New incidents may not persist between deployments
- ⚠️ Incident list may not refresh immediately after adding
- ⚠️ Data resets to default incidents on cold starts

### Temporary Solutions Applied:
1. **State management**: Added refresh triggers to update the incident list
2. **Error handling**: Graceful fallback when file operations fail
3. **Caching**: In-memory storage for the duration of function execution

## Testing on Vercel

To test the current implementation:

1. Deploy to Vercel
2. Add a new incident using the Quick Add feature
3. Verify the icon appears on the map
4. Check if the incident appears in the list (should work with the updates)
5. Refresh the page - incident may or may not persist depending on serverless function state

## Next Steps for Production

1. **Implement database storage** (PostgreSQL, MongoDB, or Supabase)
2. **Add user authentication** for incident reporting
3. **Implement real-time updates** with WebSockets or Server-Sent Events
4. **Add data validation** and sanitization
5. **Implement rate limiting** to prevent spam
6. **Add geolocation verification** for incident locations
