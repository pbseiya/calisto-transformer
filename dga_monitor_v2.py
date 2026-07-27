#!/usr/bin/env python3
"""
DGA Monitor v2 - Enhanced Reliability
- Retry mechanism with exponential backoff
- Data validation
- Health check API
- Alerting system
- Connection pooling
"""
import os
import time
import logging
import json
import threading
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass, asdict, field
from dotenv import load_dotenv
from pymodbus.client import ModbusTcpClient
import psycopg2
from psycopg2 import pool
import httpx
from fastapi import FastAPI, HTTPException
import uvicorn

# Load environment variables
load_dotenv()

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════

@dataclass
class Config:
    # Devices
    DEVICES: List[Dict] = field(default_factory=lambda: [
        {"name": "DA115", "ip": os.getenv("DA115_IP", "10.31.204.5"), "slave_id": 1},
        {"name": "KT1A", "ip": os.getenv("KT1A_IP", "10.31.204.7"), "slave_id": 1},
        {"name": "KT2A", "ip": os.getenv("KT2A_IP", "10.31.204.8"), "slave_id": 1},
        {"name": "KT3A", "ip": os.getenv("KT3A_IP", "10.31.204.46"), "slave_id": 2},
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
        {"name": "34BAT02", "ip": "10.31.204.36", "slave_id": 1},
        {"name": "11BAT01", "ip": "10.31.204.43", "slave_id": 1},
        {"name": "12BAT01", "ip": "10.31.204.44", "slave_id": 1},
        {"name": "15BAT01", "ip": "10.31.204.47", "slave_id": 1},
        {"name": "16BAT01", "ip": "10.31.204.48", "slave_id": 1},
        {"name": "TR_B2-1001", "ip": "10.31.204.49", "slave_id": 2},
        {"name": "TR_B2-1002", "ip": "10.31.204.50", "slave_id": 2},
    ])
    
    # Gateway
    GATEWAY_URL: str = os.getenv("GATEWAY_URL", "http://10.29.82.42")
    GATEWAY_USER: str = os.getenv("GATEWAY_USER", "admin")
    GATEWAY_PASSWORD: str = os.getenv("GATEWAY_PASSWORD", "admin")
    CHECK_GATEWAY: bool = os.getenv("CHECK_GATEWAY", "true").lower() == "true"
    
    # Polling
    POLL_INTERVAL: int = int(os.getenv("POLL_INTERVAL", "15"))
    
    # Retry
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    RETRY_BASE_DELAY: float = float(os.getenv("RETRY_BASE_DELAY", "1.0"))
    RETRY_MAX_DELAY: float = float(os.getenv("RETRY_MAX_DELAY", "30.0"))
    
    # Database
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "dga_monitor")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    
    # Alerting
    ALERT_ENABLED: bool = os.getenv("ALERT_ENABLED", "true").lower() == "true"
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    ALERT_THRESHOLD: int = int(os.getenv("ALERT_THRESHOLD", "3"))  # Consecutive failures
    
    # Health check
    HEALTH_CHECK_PORT: int = int(os.getenv("HEALTH_CHECK_PORT", "8081"))

CONFIG = Config()

# Register Map
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

# Data validation ranges (ppm)
VALIDATION_RANGES = {
    "hydrogen": (0, 2000),
    "carbonmonoxide": (0, 3000),
    "water_content": (0, 50),
}

# ═══════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('dga_monitor_v2.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════
# HEALTH TRACKER
# ═══════════════════════════════════════════════════════════

class HealthTracker:
    """Track device health and system status"""
    
    def __init__(self):
        self.device_failures: Dict[str, int] = {}
        self.last_success: Dict[str, datetime] = {}
        self.total_reads: int = 0
        self.successful_reads: int = 0
        self.failed_reads: int = 0
        self.start_time: datetime = datetime.now()
        self.lock = threading.Lock()
    
    def record_success(self, device_name: str):
        with self.lock:
            self.device_failures[device_name] = 0
            self.last_success[device_name] = datetime.now()
            self.total_reads += 1
            self.successful_reads += 1
    
    def record_failure(self, device_name: str) -> int:
        with self.lock:
            self.device_failures[device_name] = self.device_failures.get(device_name, 0) + 1
            self.total_reads += 1
            self.failed_reads += 1
            return self.device_failures[device_name]
    
    def get_failure_count(self, device_name: str) -> int:
        with self.lock:
            return self.device_failures.get(device_name, 0)
    
    def get_status(self) -> Dict:
        with self.lock:
            uptime = (datetime.now() - self.start_time).total_seconds()
            success_rate = (self.successful_reads / self.total_reads * 100) if self.total_reads > 0 else 0
            
            unhealthy_devices = [
                name for name, failures in self.device_failures.items()
                if failures >= CONFIG.ALERT_THRESHOLD
            ]
            
            return {
                "status": "healthy" if not unhealthy_devices else "degraded",
                "uptime_seconds": int(uptime),
                "total_reads": self.total_reads,
                "successful_reads": self.successful_reads,
                "failed_reads": self.failed_reads,
                "success_rate": round(success_rate, 2),
                "unhealthy_devices": unhealthy_devices,
                "device_failures": dict(self.device_failures),
                "last_success": {k: v.isoformat() for k, v in self.last_success.items()},
            }

health_tracker = HealthTracker()

# ═══════════════════════════════════════════════════════════
# ALERTING SYSTEM
# ═══════════════════════════════════════════════════════════

class AlertingSystem:
    """Send alerts via Telegram"""
    
    def __init__(self):
        self.bot_token = CONFIG.TELEGRAM_BOT_TOKEN
        self.chat_id = CONFIG.TELEGRAM_CHAT_ID
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None
    
    async def send_alert(self, message: str) -> bool:
        if not CONFIG.ALERT_ENABLED or not self.api_url:
            logger.warning("Alerting disabled or not configured")
            return False
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.api_url}/sendMessage",
                    json={
                        "chat_id": self.chat_id,
                        "text": message,
                        "parse_mode": "Markdown",
                    },
                )
                if response.status_code == 200:
                    logger.info("Alert sent successfully")
                    return True
                else:
                    logger.error(f"Telegram API error: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")
            return False
    
    async def alert_device_failure(self, device_name: str, failure_count: int, error: str):
        message = (
            f"⚠️ *DGA Monitor Alert*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"🔌 Device: `{device_name}`\n"
            f"❌ Failures: {failure_count} consecutive\n"
            f"🔍 Error: {error[:100]}\n"
            f"🕐 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        )
        await self.send_alert(message)
    
    async def alert_system_status(self, status: Dict):
        message = (
            f"📊 *DGA Monitor Status*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"Status: {status['status']}\n"
            f"Uptime: {status['uptime_seconds']}s\n"
            f"Success Rate: {status['success_rate']}%\n"
            f"Total Reads: {status['total_reads']}\n"
            f"Failed: {status['failed_reads']}\n"
            f"Unhealthy Devices: {len(status['unhealthy_devices'])}\n"
        )
        if status['unhealthy_devices']:
            message += f"Devices: {', '.join(status['unhealthy_devices'])}\n"
        await self.send_alert(message)

alerting_system = AlertingSystem()

# ═══════════════════════════════════════════════════════════
# DATA VALIDATION
# ═══════════════════════════════════════════════════════════

class DataValidator:
    """Validate DGA readings"""
    
    @staticmethod
    def validate_reading(data: Dict) -> Tuple[bool, List[str]]:
        errors = []
        
        # Check required fields
        required = ["device_name", "timestamp", "hydrogen", "carbonmonoxide", "water_content"]
        for field in required:
            if field not in data or data[field] is None:
                errors.append(f"Missing required field: {field}")
        
        # Check ranges
        for field, (min_val, max_val) in VALIDATION_RANGES.items():
            if field in data and data[field] is not None:
                value = data[field]
                if value < min_val or value > max_val:
                    errors.append(f"{field}={value} out of range [{min_val}, {max_val}]")
        
        return len(errors) == 0, errors

validator = DataValidator()

# ═══════════════════════════════════════════════════════════
# DATABASE CONNECTION POOL
# ═══════════════════════════════════════════════════════════

class DatabasePool:
    """PostgreSQL connection pool"""
    
    def __init__(self):
        self.pool: Optional[pool.SimpleConnectionPool] = None
    
    def initialize(self):
        try:
            self.pool = pool.SimpleConnectionPool(
                minconn=1,
                maxconn=CONFIG.DB_POOL_SIZE,
                host=CONFIG.DB_HOST,
                port=CONFIG.DB_PORT,
                dbname=CONFIG.DB_NAME,
                user=CONFIG.DB_USER,
                password=CONFIG.DB_PASSWORD
            )
            logger.info(f"✅ Database pool initialized (size={CONFIG.DB_POOL_SIZE})")
        except Exception as e:
            logger.error(f"❌ Database pool initialization failed: {e}")
            raise
    
    def get_connection(self):
        if not self.pool:
            raise Exception("Database pool not initialized")
        return self.pool.getconn()
    
    def release_connection(self, conn):
        if self.pool and conn:
            self.pool.putconn(conn)
    
    def close_all(self):
        if self.pool:
            self.pool.closeall()
            logger.info("Database pool closed")

db_pool = DatabasePool()

# ═══════════════════════════════════════════════════════════
# MODBUS READER WITH RETRY
# ═══════════════════════════════════════════════════════════

class ModbusReader:
    """Read Modbus registers with retry mechanism"""
    
    def __init__(self):
        self.connection_cache: Dict[str, ModbusTcpClient] = {}
    
    def _get_connection(self, ip: str) -> ModbusTcpClient:
        if ip not in self.connection_cache:
            client = ModbusTcpClient(ip, port=502, timeout=5)
            self.connection_cache[ip] = client
        return self.connection_cache[ip]
    
    def _retry_with_backoff(self, func, *args, **kwargs):
        """Execute function with exponential backoff retry"""
        last_error = None
        
        for attempt in range(CONFIG.MAX_RETRIES):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_error = e
                if attempt < CONFIG.MAX_RETRIES - 1:
                    delay = min(
                        CONFIG.RETRY_BASE_DELAY * (2 ** attempt),
                        CONFIG.RETRY_MAX_DELAY
                    )
                    logger.warning(f"Attempt {attempt + 1} failed, retrying in {delay}s: {e}")
                    time.sleep(delay)
        
        raise last_error
    
    def read_device(self, device: Dict) -> Optional[Dict]:
        """Read all registers from a device with retry"""
        ip = device["ip"]
        name = device["name"]
        slave_id = device.get("slave_id", 1)
        
        def _read():
            client = self._get_connection(ip)
            data = {"device_name": name, "timestamp": datetime.now()}
            
            if not client.connect():
                raise ConnectionError(f"Cannot connect to {name} ({ip})")
            
            try:
                # Read Input Registers
                ir_resp = client.read_input_registers(0, count=25, device_id=slave_id)
                if ir_resp.isError():
                    raise Exception(f"IR read error: {ir_resp}")
                ir_vals = {i: v for i, v in enumerate(ir_resp.registers)}
                
                # Read Discrete Inputs
                di_resp = client.read_discrete_inputs(0, count=6, device_id=slave_id)
                if di_resp.isError():
                    raise Exception(f"DI read error: {di_resp}")
                di_vals = {i: int(v) for i, v in enumerate(di_resp.bits)}
                
                # Map values
                for param, config in REGISTER_MAP.items():
                    if config["type"] == "ir":
                        data[param] = ir_vals.get(config["addr"])
                    elif config["type"] == "di":
                        data[param] = di_vals.get(config["addr"])
                
                return data
                
            finally:
                client.close()
        
        try:
            return self._retry_with_backoff(_read)
        except Exception as e:
            logger.error(f"Failed to read {name} after {CONFIG.MAX_RETRIES} attempts: {e}")
            return None

modbus_reader = ModbusReader()

# ═══════════════════════════════════════════════════════════
# GATEWAY CHECK
# ═══════════════════════════════════════════════════════════

def check_gateway_status() -> Optional[set]:
    """Check gateway Poll Status"""
    if not CONFIG.CHECK_GATEWAY:
        return None
    
    try:
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            page.goto(CONFIG.GATEWAY_URL)
            page.wait_for_timeout(2000)
            
            page.fill('#inputEmail', CONFIG.GATEWAY_USER)
            page.fill('#inputPassword', CONFIG.GATEWAY_PASSWORD)
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
        logger.warning(f"Gateway check failed: {e}")
        return set()

# ═══════════════════════════════════════════════════════════
# DATABASE OPERATIONS
# ═══════════════════════════════════════════════════════════

def save_to_db(data: Dict) -> bool:
    """Save data to PostgreSQL with validation"""
    if data is None:
        return False
    
    # Validate data
    is_valid, errors = validator.validate_reading(data)
    if not is_valid:
        logger.warning(f"Data validation failed for {data.get('device_name')}: {errors}")
        return False
    
    conn = None
    try:
        conn = db_pool.get_connection()
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
        return True
        
    except Exception as e:
        logger.error(f"Database save error: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            db_pool.release_connection(conn)

# ═══════════════════════════════════════════════════════════
# HEALTH CHECK API
# ═══════════════════════════════════════════════════════════

app = FastAPI(title="DGA Monitor Health Check")

@app.get("/health")
async def health_check():
    return health_tracker.get_status()

@app.get("/devices")
async def list_devices():
    return {"devices": CONFIG.DEVICES}

@app.get("/metrics")
async def metrics():
    status = health_tracker.get_status()
    return {
        "dga_monitor_uptime_seconds": status["uptime_seconds"],
        "dga_monitor_total_reads": status["total_reads"],
        "dga_monitor_successful_reads": status["successful_reads"],
        "dga_monitor_failed_reads": status["failed_reads"],
        "dga_monitor_success_rate": status["success_rate"],
    }

def start_health_check_server():
    """Start health check API server in background thread"""
    def run():
        uvicorn.run(app, host="0.0.0.0", port=CONFIG.HEALTH_CHECK_PORT, log_level="warning")
    
    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    logger.info(f"✅ Health check API started on port {CONFIG.HEALTH_CHECK_PORT}")

# ═══════════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════════

async def check_and_alert(device_name: str, failure_count: int, error: str):
    """Check if alert should be sent"""
    if failure_count >= CONFIG.ALERT_THRESHOLD:
        await alerting_system.alert_device_failure(device_name, failure_count, error)

def main():
    """Main monitoring loop"""
    logger.info("=" * 60)
    logger.info("DGA Monitor v2 Starting")
    logger.info(f"Devices: {len(CONFIG.DEVICES)} devices configured")
    logger.info(f"Poll interval: {CONFIG.POLL_INTERVAL}s")
    logger.info(f"Max retries: {CONFIG.MAX_RETRIES}")
    logger.info(f"Alert threshold: {CONFIG.ALERT_THRESHOLD} failures")
    logger.info(f"Database pool size: {CONFIG.DB_POOL_SIZE}")
    logger.info(f"Health check port: {CONFIG.HEALTH_CHECK_PORT}")
    logger.info("=" * 60)
    
    # Initialize database pool
    try:
        db_pool.initialize()
    except Exception as e:
        logger.error(f"Cannot initialize database pool: {e}")
        return
    
    # Start health check server
    start_health_check_server()
    
    try:
        while True:
            # Check gateway status
            active_devices = check_gateway_status()
            
            if active_devices is None:
                devices_to_poll = CONFIG.DEVICES
            else:
                devices_to_poll = [d for d in CONFIG.DEVICES if (d["ip"], d["slave_id"]) in active_devices]
            
            if not devices_to_poll:
                logger.info("No active devices (all showing error on gateway)")
            else:
                logger.info(f"Polling {len(devices_to_poll)} active devices")
                
                for device in devices_to_poll:
                    data = modbus_reader.read_device(device)
                    
                    if data:
                        if save_to_db(data):
                            health_tracker.record_success(device["name"])
                        else:
                            failure_count = health_tracker.record_failure(device["name"])
                            # Alert in background
                            import asyncio
                            asyncio.create_task(check_and_alert(device["name"], failure_count, "Data validation failed"))
                    else:
                        failure_count = health_tracker.record_failure(device["name"])
                        # Alert in background
                        import asyncio
                        asyncio.create_task(check_and_alert(device["name"], failure_count, "Read failed"))
            
            logger.info(f"Sleeping {CONFIG.POLL_INTERVAL}s...")
            time.sleep(CONFIG.POLL_INTERVAL)
            
    except KeyboardInterrupt:
        logger.info("Monitor stopped by user")
    finally:
        db_pool.close_all()

if __name__ == "__main__":
    main()
