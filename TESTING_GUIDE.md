# Quick Start Guide - Testing the Access Management API

## 🌐 Access Swagger Documentation

Open your browser and navigate to:

```
http://localhost:8090/docs
```

### Using Swagger UI:
1. Click the **"Authorize"** button (🔒 icon, top right)
2. Enter admin key: `your-secret-admin-key-change-this-in-production`
3. Click **"Authorize"** then **"Close"**
4. Now you can test any endpoint directly in the browser!

### Try the Parquet Export:
1. Find **"Admin - Exports"** section
2. Click on `POST /admin/exports/parquet`
3. Click **"Try it out"**
4. (Optional) Enter a custom filename in the request body
5. Click **"Execute"**
6. See the response with file metadata!

---

## 📝 Alternative: ReDoc Documentation

For a cleaner, read-only documentation view:

```
http://localhost:8090/redoc
```

---

## 🧪 Command Line Testing

### Quick Test (Copy & Paste):

```bash
# Test export with auto-generated filename
curl -X POST \
  -H "X-Admin-Key: your-secret-admin-key-change-this-in-production" \
  http://localhost:8090/admin/exports/parquet
```

### Test with Custom Filename:

```bash
curl -X POST \
  -H "X-Admin-Key: your-secret-admin-key-change-this-in-production" \
  -H "Content-Type: application/json" \
  -d '{"filename":"my_export"}' \
  http://localhost:8090/admin/exports/parquet
```

### View Exported Files:

```bash
ls -lh data/parquet/
```

---

## 🧰 Automated Test Script

Run the comprehensive test suite:

```bash
./test_parquet_export.sh
```

This will test:
- ✓ API health check
- ✓ Export with auto-generated filename
- ✓ Export with custom filename
- ✓ Authorization (401 without admin key)
- ✓ File listing
- ✓ Parquet file validation

---

## 🐍 Reading Parquet Files (Python)

### Inside Docker Container:

```bash
docker exec -it access-management-api python3
```

Then:

```python
import pyarrow.parquet as pq

# Read the Parquet file
table = pq.read_table('data/parquet/my_export.parquet')

# View schema
print(table.schema)

# View row count
print(f"Rows: {len(table)}")

# View first few rows
for i in range(3):
    print(table.slice(i, 1).to_pylist()[0])
```

### On Your Local Machine (if you have Python + pyarrow):

```python
import pyarrow.parquet as pq

# Read the file
table = pq.read_table('data/parquet/my_export.parquet')

# Convert to pandas (if installed)
df = table.to_pandas()
print(df)

# Or access columns directly
print(f"Usernames: {table.column('username').to_pylist()}")
print(f"Access names: {table.column('access_name').to_pylist()}")
```

---

## 📊 All Available Endpoints

### Admin Endpoints (require X-Admin-Key header):

**User Management:**
- `POST /admin/users` - Create user
- `GET /admin/users` - List users
- `GET /admin/users/{user_id}` - Get user
- `PATCH /admin/users/{user_id}` - Update user
- `DELETE /admin/users/{user_id}` - Delete user

**Access Catalog:**
- `GET /admin/accesses` - List accesses
- `GET /admin/accesses/{access_id}` - Get access
- `POST /admin/accesses` - Create access
- `PATCH /admin/accesses/{access_id}` - Update access
- `DELETE /admin/accesses/{access_id}` - Delete access

**Analytics:**
- `POST /admin/analytics/query` - Execute custom SQL

**Exports:**
- `POST /admin/exports/parquet` - Export to Parquet

### User Endpoints (require X-Username header):

- `GET /users/{user_id}/accesses` - View my accesses
- `POST /users/{user_id}/accesses` - Request new access
- `DELETE /users/{user_id}/accesses/{access_id}` - Remove my access

---

## 🔑 Authentication

### Admin Authentication:
Add header: `X-Admin-Key: your-secret-admin-key-change-this-in-production`

### User Authentication:
Add header: `X-Username: <your-username>`

---

## 🎯 Example: Complete Workflow

```bash
# 1. Check API health
curl http://localhost:8090/health

# 2. List all users (admin)
curl -H "X-Admin-Key: your-secret-admin-key-change-this-in-production" \
  http://localhost:8090/admin/users

# 3. View user's accesses
curl -H "X-Username: admin" \
  http://localhost:8090/users/1/accesses

# 4. Export all data to Parquet
curl -X POST \
  -H "X-Admin-Key: your-secret-admin-key-change-this-in-production" \
  http://localhost:8090/admin/exports/parquet

# 5. Verify the export
ls -lh data/parquet/
```

---

## 🐳 Docker Commands

```bash
# View logs
docker logs access-management-api

# Restart container
docker-compose restart

# Stop container
docker-compose down

# Rebuild (after code changes)
docker-compose build --no-cache
docker-compose up -d
```

---

## 🎉 You're Ready!

The API is fully functional with:
- ✅ User management
- ✅ Access management
- ✅ Authorization
- ✅ Custom SQL queries
- ✅ Parquet export
- ✅ Auto-generated Swagger docs

**Next**: Open http://localhost:8090/docs and start exploring! 🚀
