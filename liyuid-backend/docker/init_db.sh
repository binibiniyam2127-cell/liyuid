#!/bin/bash
set -e

service postgresql start
service redis-server start

su - postgres << 'EOSQL'
psql << 'SQL'
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'liyuid_admin') THEN 
    CREATE USER liyuid_admin WITH SUPERUSER PASSWORD 'password'; 
  END IF; 
END 
$$;
SQL

psql -tc "SELECT 1 FROM pg_database WHERE datname = 'liyuid_db'" | grep -q 1 || psql -c "CREATE DATABASE liyuid_db OWNER liyuid_admin;"
psql -d liyuid_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -d liyuid_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
EOSQL

sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/18/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/18/main/pg_hba.conf
echo "host all all ::0/0 md5" >> /etc/postgresql/18/main/pg_hba.conf
service postgresql restart

echo "ALL SERVICES READY"

