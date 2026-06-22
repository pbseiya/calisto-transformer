# DGA Testing Report

**Date:** 2026-06-17  
**Devices Tested:** DA115, KT1A, KT2A, KT3A  
**Gateway:** Matrix Gateway Logger V3.0 @ 10.29.82.42  
**Dashboard:** SMCC @ 10.31.37.21/smcc/meterrealtime.php

---

## Register Map (Verified)

ค่า address ที่ถูกต้องจากการทดสอบ Modbus โดยตรงกับ 4 devices และเปรียบเทียบกับ Dashboard

| Block | Parameter | Function Code | Address | Evidence |
|-------|-----------|--------------|---------|----------|
| B-1 | Hydrogen | 04 IR | **2** | ✅ ตรงทั้ง 4 devices + dashboard |
| B-2 | Carbonmonoxide | 04 IR | **20** | ✅ KT2A ตรง, DA115/KT1A ค่าใกล้ (real-time diff) |
| B-3 | Water Content | 04 IR | **5** | ✅ ตรงทั้ง 4 devices + dashboard |
| B-4 | H2 alarm lv1 | 02 DI | **0** | ✅ DA115 ON ตรง dashboard |
| B-5 | H2 alarm lv.2 | 02 DI | **1** | ✅ DA115 ON ตรง dashboard |
| B-6 | CO alarm lv.1 | 02 DI | **2** | ✅ ทั้ง 4 devices OFF ตรง dashboard |
| B-7 | CO alarm lv.2 | 02 DI | **3** | ✅ ทั้ง 4 devices OFF ตรง dashboard |
| B-8 | WC alarm lv.1 | 02 DI | **4** | ✅ ทั้ง 4 devices OFF ตรง dashboard |
| B-9 | WC alarm lv.2 | 02 DI | **5** | ✅ ทั้ง 4 devices OFF ตรง dashboard |

### Alarm Status (DI)

Alarm เก็บใน **Discrete Inputs (FC02)** address 0-5 เรียงตามลำดับ:
- DI[0] = H2 Alarm Level 1
- DI[1] = H2 Alarm Level 2
- DI[2] = CO Alarm Level 1
- DI[3] = CO Alarm Level 2
- DI[4] = WC Alarm Level 1
- DI[5] = WC Alarm Level 2

### Alarm Thresholds (เก็บใน IR)

Threshold ค่า alarm เก็บใน Input Registers:
- IR[1] = H2 Alarm Lv1 threshold (250)
- IR[22] = CO Alarm Lv1 threshold (2160)
- IR[23] = CO Alarm Lv2 threshold (~16700)
- IR[31] = WC Alarm Lv1 threshold (17240)
- IR[32] = WC Alarm Lv2 threshold (0 = disabled)

---

## Gateway Config: ปัจจุบัน vs ควรแก้

### Read Block Setup ที่ต้องแก้ (8 ใน 9 blocks)

| Block | Parameter | ปัจจุบัน (ผิด) | ควรเป็น |
|-------|-----------|---------------|---------|
| B-1 | Hydrogen | 04 IR addr=**2** ✅ | ไม่ต้องแก้ |
| B-2 | Carbonmonoxide | 04 IR addr=**5** ❌ | 04 IR addr=**20** |
| B-3 | Water Content | 04 IR addr=**20** ❌ | 04 IR addr=**5** |
| B-4 | H2 alarm lv1 | 02 DI addr=**1**  | 02 DI addr=**0** |
| B-5 | H2 alarm lv.2 | 02 DI addr=**20** ❌ | 02 DI addr=**1** |
| B-6 | CO alarm lv.1 | 02 DI addr=**22** ❌ | 02 DI addr=**2** |
| B-7 | CO alarm lv.2 | 02 DI addr=**23**  | 02 DI addr=**3** |
| B-8 | WC alarm lv.1 | 02 DI addr=**31** ❌ | 02 DI addr=**4** |
| B-9 | WC alarm lv.2 | 02 DI addr=**32** ❌ | 02 DI addr=**5** |

### Pattern ที่พบ

Gateway config เดิมใช้ address กระโดดแบบไม่มี pattern (1, 5, 20, 22, 23, 31, 32) — **ผิดทั้งหมด**

Address จริง:
- **IR**: 2, 20, 5 (H2, CO, WC)
- **DI**: 0, 1, 2, 3, 4, 5 (alarm เรียงลำดับ)

---

## Device Test Results

### DA115 (10.31.204.5) — E1C SUB

| Parameter | Modbus | Dashboard | Alarm |
|-----------|--------|-----------|-------|
| Hydrogen | 1221 ppm | 1217-1221 ppm |  Lv1+Lv2 ON |
| Carbonmonoxide | 580 ppm | 555-580 ppm | OFF |
| Water Content | 9 ppm | 9 ppm | OFF |

**Status:** H₂ สูงเกิน Alarm Lv2 (555) ต้องตรวจสอบ

### KT1A (10.31.204.7) — E1B SUB

| Parameter | Modbus | Dashboard | Alarm |
|-----------|--------|-----------|-------|
| Hydrogen | 13 ppm | 13 ppm | OFF |
| Carbonmonoxide | 330-382 ppm | 382 ppm | OFF |
| Water Content | 16 ppm | 16 ppm | OFF |

**Status:** ปกติ

### KT2A (10.31.204.8) — E1B SUB

| Parameter | Modbus | Dashboard | Alarm |
|-----------|--------|-----------|-------|
| Hydrogen | 11 ppm | 11 ppm | OFF |
| Carbonmonoxide | 420-425 ppm | 425 ppm | OFF |
| Water Content | 12 ppm | 12 ppm | OFF |

**Status:** ปกติ

### KT3A (10.31.204.9) — E1B SUB

| Parameter | Modbus | Dashboard | Alarm |
|-----------|--------|-----------|-------|
| Hydrogen | 5 ppm | 2 ppm ⚠️ | OFF |
| Carbonmonoxide | 355 ppm | 485 ppm ⚠️ | OFF |
| Water Content | 3 ppm | 2 ppm ️ | OFF |

**Status:** ปกติ แต่ค่า Modbus กับ Dashboard ต่างกันเพราะ Dashboard refresh ทุก 15 นาที

---

## Devices ที่มีปัญหา

### 70BAT01 (10.31.204.3) — IP SUB
- **Poll Count:** 65,714 | **Error Count:** ~27,520 | **Error Rate:** ~42%
- TCP port 502: **CLOSED** จากเครื่องเรา
- Vendor แจ้ง: "unknow error เกิดจากอุปกรณ์ไม่ส่งข้อมูลในบางช่วงเป็นปกติ"
- **ประเมิน:** มีปัญหาบางส่วน อาจ intermittent

### 70BAT02 (10.31.204.4) — IP SUB
- **Poll Count:** 65,714 | **Error Count:** 65,714 | **Error Rate:** **100%**
- TCP port 502: **CLOSED** จากเครื่องเรา
- **ประเมิน:** ไม่ตอบเลยแม้แต่ครั้งเดียว — ต้องตรวจสอบที่หน้างาน

---

## DGA Standard Values (IEC 60599 / IEEE C57.104)

| Gas | Normal | Alert | Action |
|-----|--------|-------|--------|
| **H₂ (Hydrogen)** | <100 ppm | 100-500 ppm | >500 ppm |
| **CO (Carbon Monoxide)** | <500 ppm | 500-1000 ppm | >1000 ppm |
| **WC (Water Content)** | <20 ppm | 20-35 ppm | >35 ppm |

### สถานะปัจจุบัน

| Device | H₂ | CO | WC | Overall |
|--------|-----|-----|-----|---------|
| DA115 | 🔴 1221 (>500) | ⚠️ 580 (>500) | ✅ 9 | **Action Required** |
| KT1A | ✅ 13 | ⚠️ 330-382 | ✅ 16 | Monitor |
| KT2A | ✅ 11 | ⚠️ 420 | ✅ 12 | Monitor |
| KT3A | ✅ 5 | ⚠️ 355 | ✅ 3 | Monitor |

---

## Monitoring System

### Architecture
```
DGA Devices (Modbus TCP)
    ↓ poll every 15s
dga_monitor.py (seiya-thinkstation)
    ↓ write
PostgreSQL (Docker @ seiya-thinkstation)
    ↓ query
Dashboard / Reports
```

### Database
- **Host:** seiya-thinkstation (100.123.214.57 via Tailscale)
- **Database:** dga_monitor (Docker container: postgres_db)
- **Table:** dga_readings
- **View:** latest_readings
- **Poll interval:** 15 seconds
- **Data volume:** ~5,760 records/day/device

### Query Examples

```sql
-- Latest readings all devices
SELECT * FROM latest_readings;

-- DA115 historical (last 100)
SELECT * FROM dga_readings 
WHERE device_name = 'DA115' 
ORDER BY timestamp DESC LIMIT 100;

-- Daily average
SELECT device_name, DATE(timestamp) as date,
       AVG(hydrogen) as avg_h2,
       AVG(carbonmonoxide) as avg_co,
       AVG(water_content) as avg_wc
FROM dga_readings
GROUP BY device_name, DATE(timestamp)
ORDER BY date DESC;

-- Alarm events
SELECT * FROM dga_readings
WHERE h2_alarm_lv1 = 1 OR h2_alarm_lv2 = 1
ORDER BY timestamp DESC;
```

### Service Management

```bash
# Start
cd ~/projects/calisto-transformer
nohup python3 dga_monitor.py > /dev/null 2>&1 &
echo $! > monitor.pid

# Stop
kill $(cat monitor.pid)

# View logs
tail -f dga_monitor.log

# Check data
docker exec postgres_db psql -U postgres -d dga_monitor \
  -c 'SELECT * FROM latest_readings;'
```

---

## Files

| File | Purpose |
|------|---------|
| `dga_monitor.py` | Main monitoring script |
| `setup_db.py` | Database setup script |
| `modbus_scan.py` | Initial Modbus scanner |
| `modbus_deep_scan2.py` | Deep register scanner |
| `requirements.txt` | Python dependencies |
| `.env.example` | Environment config template |
| `dga-monitor.service` | systemd service file |
| `deploy.sh` | Deployment script |
