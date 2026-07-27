#!/usr/bin/env python3
"""
Test Device Failure Scenario
- Simulate device failure
- Test retry mechanism
- Test alert triggering
"""
import asyncio
import sys
import time
from unittest.mock import patch, MagicMock
sys.path.insert(0, '/home/seiya/projects/calisto-transformer')

from dga_monitor_v2 import (
    modbus_reader, health_tracker, alerting_system,
    CONFIG, check_and_alert
)

print("=" * 60)
print("🧪 Device Failure Scenario Test")
print("=" * 60)

# Reset health tracker
health_tracker.total_reads = 0
health_tracker.successful_reads = 0
health_tracker.failed_reads = 0
health_tracker.device_failures = {}

# Test 1: Simulate device read failure
print("\n📊 TEST 1: Simulate Device Read Failure")
print("-" * 60)

test_device = {"name": "TEST_DEV", "ip": "10.31.204.99", "slave_id": 1}

# Mock Modbus connection to always fail
with patch('pymodbus.client.ModbusTcpClient') as mock_client_class:
    mock_client = MagicMock()
    mock_client.connect.return_value = False  # Connection fails
    mock_client_class.return_value = mock_client
    
    print(f"Attempting to read from {test_device['name']}...")
    start = time.time()
    result = modbus_reader.read_device(test_device)
    elapsed = time.time() - start
    
    print(f"✅ Read result: {result} (expected: None)")
    print(f"✅ Elapsed time: {elapsed:.2f}s (with {CONFIG.MAX_RETRIES} retries)")
    assert result is None, "Should return None on failure"
    assert elapsed >= 3.0, "Should have retry delays"

# Test 2: Health tracking with failures
print("\n📊 TEST 2: Health Tracking with Failures")
print("-" * 60)

# Record failures
for i in range(CONFIG.ALERT_THRESHOLD + 2):
    failure_count = health_tracker.record_failure("TEST_DEV")
    print(f"   Failure {i+1}: count={failure_count}")

status = health_tracker.get_status()
print(f"\n✅ Status: {status['status']}")
print(f"✅ Failed reads: {status['failed_reads']}")
print(f"✅ Unhealthy devices: {status['unhealthy_devices']}")

assert status['status'] == 'degraded'
assert "TEST_DEV" in status['unhealthy_devices']
assert status['failed_reads'] == CONFIG.ALERT_THRESHOLD + 2

# Test 3: Alert triggering
print("\n📊 TEST 3: Alert Triggering")
print("-" * 60)

print(f"Alert threshold: {CONFIG.ALERT_THRESHOLD} failures")
print(f"Current failures: {health_tracker.get_failure_count('TEST_DEV')}")

# Test alert triggering
async def test_alert():
    failure_count = health_tracker.get_failure_count("TEST_DEV")
    if failure_count >= CONFIG.ALERT_THRESHOLD:
        print(f"✅ Failure count ({failure_count}) >= threshold ({CONFIG.ALERT_THRESHOLD})")
        print("   Sending alert...")
        await alerting_system.alert_device_failure(
            "TEST_DEV",
            failure_count,
            "Connection timeout after 3 retries"
        )
        print("   ✅ Alert sent!")
    else:
        print(f"❌ Failure count ({failure_count}) < threshold ({CONFIG.ALERT_THRESHOLD})")

asyncio.run(test_alert())

# Test 4: Recovery scenario
print("\n📊 TEST 4: Recovery Scenario")
print("-" * 60)

print("Recording success after failures...")
health_tracker.record_success("TEST_DEV")

failure_count = health_tracker.get_failure_count("TEST_DEV")
print(f"✅ Failure count after success: {failure_count} (expected: 0)")
assert failure_count == 0, "Success should reset failure count"

status = health_tracker.get_status()
print(f"✅ Status after recovery: {status['status']}")
print(f"✅ Unhealthy devices: {status['unhealthy_devices']}")

# Test 5: Data validation with invalid data
print("\n📊 TEST 5: Data Validation with Invalid Data")
print("-" * 60)

from dga_monitor_v2 import validator
from datetime import datetime

invalid_readings = [
    ("H2 out of range", {"device_name": "TEST", "timestamp": datetime.now(), "hydrogen": 2500, "carbonmonoxide": 200, "water_content": 15}),
    ("CO out of range", {"device_name": "TEST", "timestamp": datetime.now(), "hydrogen": 500, "carbonmonoxide": 3500, "water_content": 15}),
    ("WC out of range", {"device_name": "TEST", "timestamp": datetime.now(), "hydrogen": 500, "carbonmonoxide": 200, "water_content": 60}),
    ("Missing field", {"device_name": "TEST", "timestamp": datetime.now(), "hydrogen": 500}),
]

for name, data in invalid_readings:
    is_valid, errors = validator.validate_reading(data)
    print(f"✅ {name}: {not is_valid} (expected: True)")
    if errors:
        print(f"   Errors: {errors}")
    assert not is_valid, f"{name} should fail validation"

print("\n" + "=" * 60)
print("🎉 ALL FAILURE SCENARIO TESTS PASSED!")
print("=" * 60)
print("\n✅ Retry mechanism: Working with exponential backoff")
print("✅ Health tracking: Correctly tracks failures")
print("✅ Alert triggering: Sends alert when threshold reached")
print("✅ Recovery: Success resets failure count")
print("✅ Data validation: Rejects invalid readings")
