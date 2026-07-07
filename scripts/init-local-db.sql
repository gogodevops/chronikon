-- Chronikon lokale Datenbank (PostgreSQL)
-- Als Superuser ausführen, z.B. postgres

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'chronikon') THEN
    CREATE ROLE chronikon LOGIN PASSWORD 'chronikon';
  END IF;
END
$$;

SELECT 'CREATE DATABASE chronikon OWNER chronikon ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chronikon')\gexec

GRANT ALL PRIVILEGES ON DATABASE chronikon TO chronikon;
