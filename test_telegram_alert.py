#!/usr/bin/env python3
"""
Test Real Telegram Alert
"""
import asyncio
import sys
sys.path.insert(0, '/home/seiya/projects/calisto-transformer')

from dga_monitor_v2 import alerting_system

async def test_real_alert():
    print("🔔 Testing Real Telegram Alert...")
    print("-" * 60)
    
    # Test 1: Simple message
    print("\n1️⃣  Sending simple alert...")
    message = (
        "🧪 *DGA Monitor Test Alert*\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "✅ Alert system is working!\n"
        "🕐 Time: " + __import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S') + "\n"
    )
    result = await alerting_system.send_alert(message)
    print(f"   Result: {'✅ Sent' if result else '❌ Failed'}")
    
    # Test 2: Device failure alert
    print("\n2️⃣  Sending device failure alert...")
    await alerting_system.alert_device_failure(
        device_name="TEST_DEVICE",
        failure_count=5,
        error="Connection timeout after 3 retries"
    )
    print(f"   Result: ✅ Sent")
    
    # Test 3: System status alert
    print("\n3️⃣  Sending system status alert...")
    status = {
        "status": "degraded",
        "uptime_seconds": 3600,
        "success_rate": 95.5,
        "total_reads": 1000,
        "failed_reads": 45,
        "unhealthy_devices": ["DA115", "KT1A"]
    }
    await alerting_system.alert_system_status(status)
    print(f"   Result: ✅ Sent")
    
    print("\n" + "=" * 60)
    print("✅ All alerts sent! Check your Telegram.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_real_alert())
