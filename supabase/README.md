# Supabase Database Setup for Lotysis

This directory contains the complete database schema and migration files for the Lotysis lottery prediction system.

## 📁 Directory Structure

```
supabase/
├── README.md                              # This file - setup instructions
├── DATABASE_SCHEMA.md                     # Comprehensive schema documentation
└── migrations/
    └── 20250108_initial_lottery_schema.sql # Initial database migration
```

## 🚀 Quick Setup

### 1. Prerequisites

- Supabase project created at [supabase.com](https://supabase.com)
- Access to Supabase SQL Editor
- Environment variables configured in your application

### 2. Deploy Database Schema

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run Migration**
   - Copy the entire contents of `migrations/20250108_initial_lottery_schema.sql`
   - Paste into SQL Editor
   - Click "Run" to execute the migration

3. **Verify Deployment**
   - Check that the migration completes without errors
   - Verify the validation message shows all objects created successfully

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Database Schema Overview

### Tables Created

1. **`lottery_results`** - Historical lottery draw results
2. **`ml_models`** - Machine learning models and metadata
3. **`ml_predictions`** - Model predictions and accuracy tracking

### View Created

- **`draw_statistics`** - Aggregated statistics and number frequencies

### Security Features

- **Row-Level Security (RLS)** enabled on all tables
- **Anonymous users**: Read-only access to lottery results and statistics
- **Authenticated users**: Read access to all tables
- **Service role**: Full CRUD access for application operations

### Performance Features

- **Optimized indexes** on `(draw_name, date)` combinations
- **Composite indexes** for efficient multi-column queries
- **Helper functions** for common calculations

## 🔧 Post-Deployment Tasks

### 1. Test Database Access

Run these queries in SQL Editor to verify everything works:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lottery_results', 'ml_models', 'ml_predictions');

-- Check view exists
SELECT * FROM draw_statistics LIMIT 1;

-- Test RLS policies
SELECT * FROM lottery_results LIMIT 1;
```

### 2. Load Sample Data (Optional)

Uncomment and run the sample data section in the migration file to populate test data.

### 3. Update Application Code

Modify your application to use the new database schema:

```typescript
// Example: Using the LotteryResultService
import { LotteryResultService } from '@/lib/supabase'

// Get recent results
const results = await LotteryResultService.getResults({
  draw_name: 'National',
  limit: 10
})

// Add new result
const newResult = await LotteryResultService.addResult({
  draw_name: 'National',
  date: '2025-01-08',
  gagnants: [15, 23, 42, 56, 78],
  machine: [8, 19, 33, 47, 81]
})
```

## 🔐 Security Configuration

### RLS Policies Summary

| User Role | lottery_results | ml_models | ml_predictions |
|-----------|----------------|-----------|----------------|
| Anonymous | SELECT only | No access | No access |
| Authenticated | SELECT only | SELECT only | SELECT only |
| Service Role | Full CRUD | Full CRUD | Full CRUD |

### Testing RLS Policies

Use different API keys to test access levels:

```javascript
// Test with anon key (should work)
const { data } = await supabase
  .from('lottery_results')
  .select('*')
  .limit(5)

// Test with service role key for write operations
const { data } = await supabaseServiceRole
  .from('lottery_results')
  .insert([{ /* lottery result data */ }])
```

## 📈 Performance Monitoring

### Query Performance

Monitor these common queries:

```sql
-- Most frequent query pattern
SELECT * FROM lottery_results 
WHERE draw_name = 'National' 
ORDER BY date DESC 
LIMIT 10;

-- Statistics query
SELECT * FROM draw_statistics 
WHERE draw_name = 'National' 
ORDER BY frequency DESC;

-- Model lookup
SELECT * FROM ml_models 
WHERE draw_name = 'National' 
AND model_type = 'lstm' 
AND is_active = true;
```

### Index Usage

Check index effectiveness:

```sql
-- View index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## 🛠️ Troubleshooting

### Common Issues

1. **Migration Fails**
   ```
   Error: relation "lottery_results" already exists
   ```
   **Solution**: The tables already exist. Either drop them first or modify the migration to use `CREATE TABLE IF NOT EXISTS`.

2. **RLS Access Denied**
   ```
   Error: new row violates row-level security policy
   ```
   **Solution**: Use service role key for write operations, or check if user has correct permissions.

3. **Array Constraint Violations**
   ```
   Error: new row violates check constraint "lottery_results_gagnants_valid"
   ```
   **Solution**: Ensure arrays contain exactly 5 numbers between 1-90.

### Debug Commands

```sql
-- Check current user role
SELECT current_user, current_setting('role');

-- List all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check table permissions
SELECT * FROM information_schema.table_privileges 
WHERE table_schema = 'public';
```

## 🔄 Backup and Recovery

### Regular Backups

Set up automatic backups in Supabase dashboard:
- Go to Settings > Database
- Configure backup schedule
- Test restore procedures

### Manual Backup

```sql
-- Export data for backup
COPY lottery_results TO '/tmp/lottery_results_backup.csv' WITH CSV HEADER;
COPY ml_models TO '/tmp/ml_models_backup.csv' WITH CSV HEADER;
COPY ml_predictions TO '/tmp/ml_predictions_backup.csv' WITH CSV HEADER;
```

## 📚 Additional Resources

- **[Full Schema Documentation](./DATABASE_SCHEMA.md)** - Comprehensive database documentation
- **[Supabase Documentation](https://supabase.com/docs)** - Official Supabase docs
- **[PostgreSQL Documentation](https://www.postgresql.org/docs/)** - PostgreSQL reference

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the full schema documentation
3. Verify environment variables are correctly set
4. Test queries in Supabase SQL Editor
5. Check Supabase logs for detailed error messages

## 📝 Migration History

- **20250108_initial_lottery_schema.sql** - Initial database schema with tables, views, indexes, and RLS policies

---

**Next Steps**: After successfully running this migration, proceed to test the application with the new database schema and verify all functionality works as expected.
