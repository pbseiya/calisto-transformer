#!/usr/bin/env python3
"""
DGA Monitor - Pull Modbus data every 15 seconds and store in PostgreSQL
For all DGA devices (22 active devices)

Checks gateway Poll Status before polling - skips devices with errors
"""
import os
import time
import logging
from datetime import datetime
from dotenv import load_dotenv
from pymodbus.client import ModbusTcpClient
import psycopg2
from playwright.sync_api import sync_playwright

# Load environment variables
load_dotenv()

# Configuration - All 22 active devices
DEVICES = [
    # Existing devices
    {"name": "DA115", "ip": os.getenv("DA115_IP", "10.31.204.5"), "slave_id": 1},
    {"name": "KT1A", "ip": os.getenv("KT1A_IP", "10.31.204.7"), "slave_id": 1},
    {"name": "KT2A", "ip": os.getenv("KT2A_IP", "10.31.204.8"), "slave_id": 1},
    {"name": "KT3A", "ip": os.getenv("KT3A_IP", "10.31.204.46"), "slave_id": 2},  # Fixed IP and slave_id
    
    # New devices
    {"name": "09BAT02", "ip": "10.31.204.9", "slave_id": 1},
    {"name": "ENB-101-A", "ip": "10.31.204.27", "slave_id": 1},
    {"name": "ENB-101-B", "ip": "10.31.204.28", "slave_id": 1},
    {"name": "TR_1D-VSD", "ip": "10.31.204.29", "slave_id": 1},
    {"name": "TR_1A", "ip": "10.31.204.30", "slave_id": 1},
    {"name": "TR_1B", "ip": "10.31.204.31", "slave_id": 1},
    {"name": "DA04", "ip": "10.31.204.32", "slave_id": 1},
    {"name": "DA05", "ip": "10.31.204.33", "slave_id": 1},
    {"name": "DA07", "ip": "10.31.204.34", "slave_id": 1},
    {"name": "DA08", "ip": "10.31.204.35", "slave_id": 1},
    {"name": "DA09", "ip": "10.31.204.36", "slave_id": 1},
    {"name": "34BAT02", "ip": "10.31.204.36", "slave_id": 1},  # Same IP as DA09
    {"name": "11BAT01", "ip": "10.31.204.43", "slave_id": 1},
    {"name": "12BAT01", "ip": "10.31.204.44", "slave_id": 1},
    {"name": "15BAT01", "ip": "10.31.204.47", "slave_id": 1},
    {"name": "16BAT01", "ip": "10.31.204.48", "slave_id": 1},
    {"name": "TR_B2-1001", "ip": "10.31.204.49", "slave_id": 2},
    {"name": "TR_B2-1002", "ip": "10.31.204.50", "slave_id": 2},
]

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://10.29.82.42")
GATEWAY_USER = os.getenv("GATEWAY_USER", "admin")
GATEWAY_PASSWORD = os.getenv("GATEWAY_PASSWORD", "admin")
CHECK_GATEWAY = os.getenv("CHECK_GATEWAY", "true").lower() == "true"

POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "15"))  # seconds
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "dga_monitor")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

# Register Map (verified from testing)
REGISTER_MAP = {
    "hydrogen": {"type": "ir", "addr": 2},
    "carbonmonoxide": {"type": "ir", "addr": 20},
    "water_content": {"type": "ir", "addr": 5},
    "h2_alarm_lv1": {"type": "di", "addr": 0},
    "h2_alarm_lv2": {"type": "di", "addr": 1},
    "co_alarm_lv1": {"type": "di", "addr": 2},
    "co_alarm_lv2": {"type": "di", "addr": 3},
    "wc_alarm_lv1": {"type": "di", "addr": 4},
    "wc_alarm_lv2": {"type": "di", "addr": 5},
}


def check_gateway_status():
    """Check gateway Poll Status and return set of (ip, slave_id) tuples for active devices"""
    if not CHECK_GATEWAY:
        return None
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            page.goto(GATEWAY_URL)
            page.wait_for_timeout(2000)
            
            page.fill('#inputEmail', GATEWAY_USER)
            page.fill('#inputPassword', GATEWAY_PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_timeout(3000)
            
            page.click("text=Poll Status")
            page.wait_for_timeout(3000)
            
            mainframe = page.frame("mainframe")
            if not mainframe:
                logger.warning("Gateway mainframe not found")
                return set()
            
            mainframe.wait_for_selector("table", timeout=10000)
            
            rows = mainframe.query_selector_all("table tr")
            active_devices = set()
            
            for row in rows[1:]:
                cells = row.query_selector_all("td")
                if len(cells) >= 6:
                    ip = cells[2].inner_text().strip()
                    slave_id_str = cells[3].inner_text().strip()
                    status = cells[4].inner_text().strip()
                    
                    if status == "Active":
                        try:
                            slave_id = int(slave_id_str)
                            active_devices.add((ip, slave_id))
                        except ValueError:
                            pass
            
            browser.close()
            logger.info(f"Gateway check: {len(active_devices)} active devices")
            return active_devices
            
    except Exception as e:
        logger.warning(f"Gateway check failed: {e} (polling all devices)")
        return set()


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('dga_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def read_modbus(device):
    """Read all registers from a DGA device"""
    ip = device["ip"]
    name = device["name"]
    slave_id = device.get("slave_id", 1)
    
    client = ModbusTcpClient(ip, port=502, timeout=5)
    data = {"device_name": name, "timestamp": datetime.now()}
    
    try:
        if not client.connect():
            logger.warning(f"Cannot connect to {name} ({ip})")
            return None
        
        # Read Input Registers (0-25)
        ir_resp = client.read_input_registers(0, count=25, device_id=slave_id)
        if ir_resp.isError():
            logger.warning(f"IR read error for {name}")
            ir_vals = {}
        else:
            ir_vals = {i: v for i, v in enumerate(ir_resp.registers)}
        
        # Read Discrete Inputs (0-5)
        di_resp = client.read_discrete_inputs(0, count=6, device_id=slave_id)
        if di_resp.isError():
            logger.warning(f"DI read error for {name}")
            di_vals = {}
        else:
            di_vals = {i: int(v) for i, v in enumerate(di_resp.bits)}
        
        # Map values
        for param, config in REGISTER_MAP.items():
            if config["type"] == "ir":
                data[param] = ir_vals.get(config["addr"])
            elif config["type"] == "di":
                data[param] = di_vals.get(config["addr"])
        
        return data
        
    except Exception as e:
        logger.error(f"Error reading {name}: {e}")
        return None
    finally:
        client.close()


def init_db():
    """Initialize database connection"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None


def save_to_db(conn, data):
    """Save data to PostgreSQL"""
    if data is None:
        return
    
    try:
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO dga_readings (
                device_name, timestamp,
                hydrogen, carbonmonoxide, water_content,
                h2_alarm_lv1, h2_alarm_lv2,
                co_alarm_lv1, co_alarm_lv2,
                wc_alarm_lv1, wc_alarm_lv2
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            data["device_name"],
            data["timestamp"],
            data.get("hydrogen"),
            data.get("carbonmonoxide"),
            data.get("water_content"),
            data.get("h2_alarm_lv1"),
            data.get("h2_alarm_lv2"),
            data.get("co_alarm_lv1"),
            data.get("co_alarm_lv2"),
            data.get("wc_alarm_lv1"),
            data.get("wc_alarm_lv2")
        ))
        
        conn.commit()
        logger.info(f"Saved {data['device_name']}: H2={data.get('hydrogen')}, CO={data.get('carbonmonoxide')}, WC={data.get('water_content')}")
        
    except Exception as e:
        logger.error(f"Database save error: {e}")
        conn.rollback()


def main():
    """Main monitoring loop"""
    logger.info("=" * 60)
    logger.info("DGA Monitor Starting")
    logger.info(f"Devices: {len(DEVICES)} devices configured")
    for d in DEVICES:
        logger.info(f"  - {d['name']}: {d['ip']} (slave_id={d['slave_id']})")
    logger.info(f"Poll interval: {POLL_INTERVAL}s")
    logger.info(f"Database: {DB_NAME}@{DB_HOST}:{DB_PORT}")
    logger.info(f"Gateway check: {'enabled' if CHECK_GATEWAY else 'disabled'}")
    logger.info("=" * 60)
    
    conn = init_db()
    if not conn:
        logger.error("Cannot connect to database. Exiting.")
        return
    
    try:
        while True:
            active_devices = check_gateway_status()
            
            if active_devices is None:
                devices_to_poll = DEVICES
            else:
                devices_to_poll = [d for d in DEVICES if (d["ip"], d["slave_id"]) in active_devices]
            
            if not devices_to_poll:
                logger.info("No active devices (all showing error on gateway)")
            else:
                logger.info(f"Polling {len(devices_to_poll)} active devices")
                for device in devices_to_poll:
                    data = read_modbus(device)
                    if data:
                        save_to_db(conn, data)
            
            logger.info(f"Sleeping {POLL_INTERVAL}s...")
            time.sleep(POLL_INTERVAL)
            
    except KeyboardInterrupt:
        logger.info("Monitor stopped by user")
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
