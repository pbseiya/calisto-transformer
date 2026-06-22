#!/usr/bin/env python3
"""
Setup PostgreSQL database for DGA Monitor
Run this once to create database and tables
"""
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "dga_monitor")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")


def create_database():
    """Create database if not exists"""
    print(f"Creating database '{DB_NAME}'...")
    
    # Connect to default postgres database
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
    exists = cursor.fetchone()
    
    if not exists:
        cursor.execute(f'CREATE DATABASE "{DB_NAME}"')
        print(f"✅ Database '{DB_NAME}' created")
    else:
        print(f"ℹ️  Database '{DB_NAME}' already exists")
    
    cursor.close()
    conn.close()


def create_tables():
    """Create tables in the database"""
    print(f"\nCreating tables in '{DB_NAME}'...")
    
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()
    
    # Create dga_readings table
    create_table_sql = """
        CREATE TABLE IF NOT EXISTS dga_readings (
            id SERIAL PRIMARY KEY,
            device_name VARCHAR(50) NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            hydrogen INTEGER,
            carbonmonoxide INTEGER,
            water_content INTEGER,
            h2_alarm_lv1 INTEGER,
            h2_alarm_lv2 INTEGER,
            co_alarm_lv1 INTEGER,
            co_alarm_lv2 INTEGER,
            wc_alarm_lv1 INTEGER,
            wc_alarm_lv2 INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """
    
    cursor.execute(create_table_sql)
    
    # Create index for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_dga_device_time 
        ON dga_readings (device_name, timestamp DESC);
    """)
    
    # Create view for latest readings
    cursor.execute("""
        CREATE OR REPLACE VIEW latest_readings AS
        SELECT DISTINCT ON (device_name)
            device_name,
            timestamp,
            hydrogen,
            carbonmonoxide,
            water_content,
            h2_alarm_lv1,
            h2_alarm_lv2,
            co_alarm_lv1,
            co_alarm_lv2,
            wc_alarm_lv1,
            wc_alarm_lv2
        FROM dga_readings
        ORDER BY device_name, timestamp DESC;
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✅ Tables created successfully")
    print("\nTables:")
    print("  - dga_readings (main data table)")
    print("  - latest_readings (view for current values)")


def main():
    print("=" * 60)
    print("DGA Monitor Database Setup")
    print("=" * 60)
    print(f"Database: {DB_NAME}")
    print(f"Host: {DB_HOST}:{DB_PORT}")
    print(f"User: {DB_USER}")
    print("=" * 60)
    print()
    
    try:
        create_database()
        create_tables()
        print("\n✅ Setup complete!")
        print("\nYou can now run: python3 dga_monitor.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
