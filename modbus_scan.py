"""
Modbus Diagnostic Scanner
Tests connectivity and scans registers on slave devices
"""
import socket
import time
from pymodbus.client import ModbusTcpClient
from pymodbus.exceptions import ConnectionException, ModbusIOException

DEVICES = [
    {"ip": "10.31.204.3", "name": "70BAT01", "unit": 1},
    {"ip": "10.31.204.4", "name": "70BAT02", "unit": 1},
    {"ip": "10.31.204.5", "name": "DA115",   "unit": 1},
]

def read_block(client, func, addr, count, name, unit=1):
    """Read a block of registers, return (success, values, error)"""
    try:
        if func == "hr":
            resp = client.read_holding_registers(addr, count=count, device_id=unit)
        elif func == "ir":
            resp = client.read_input_registers(addr, count=count, device_id=unit)
        elif func == "coil":
            resp = client.read_coils(addr, count=count, device_id=unit)
        elif func == "di":
            resp = client.read_discrete_inputs(addr, count=count, device_id=unit)
        
        if resp.isError():
            return False, None, f"Modbus error: {resp}"
        
        return True, resp.registers if hasattr(resp, 'registers') else resp.bits, None
    except Exception as e:
        return False, None, str(e)

def scan_device(device):
    ip = device["ip"]
    name = device["name"]
    unit = device["unit"]
    
    print(f"\n{'='*70}")
    print(f"  Scanning: {name} ({ip})")
    print(f"{'='*70}")
    
    client = ModbusTcpClient(ip, port=502, timeout=5)
    
    try:
        connected = client.connect()
        if not connected:
            print(f"  ❌ Cannot connect to {ip}:502")
            return
        
        print(f"  ✅ TCP connection established")
        
        # Test basic read - Holding Registers 0-9
        print(f"\n  --- Holding Registers (FC03) addr 0-9 ---")
        ok, vals, err = read_block(client, "hr", 0, 10, "HR", unit)
        if ok:
            for i, v in enumerate(vals):
                print(f"      HR[{i:3d}] = {v:5d}  (0x{v:04X})")
        else:
            print(f"      ❌ {err}")
        
        # Input Registers 0-9
        print(f"\n  --- Input Registers (FC04) addr 0-9 ---")
        ok, vals, err = read_block(client, "ir", 0, 10, "IR", unit)
        if ok:
            for i, v in enumerate(vals):
                print(f"      IR[{i:3d}] = {v:5d}  (0x{v:04X})")
        else:
            print(f"      ❌ {err}")
        
        # Coils 0-9
        print(f"\n  --- Coils (FC01) addr 0-9 ---")
        ok, vals, err = read_block(client, "coil", 0, 10, "Coil", unit)
        if ok:
            for i, v in enumerate(vals):
                print(f"      Coil[{i:3d}] = {v}")
        else:
            print(f"      ❌ {err}")
        
        # Discrete Inputs 0-9
        print(f"\n  --- Discrete Inputs (FC02) addr 0-9 ---")
        ok, vals, err = read_block(client, "di", 0, 10, "DI", unit)
        if ok:
            for i, v in enumerate(vals):
                print(f"      DI[{i:3d}] = {v}")
        else:
            print(f"      ❌ {err}")
        
        # Wider scan - HR 0-99
        print(f"\n  --- Wider scan: Holding Registers 0-99 ---")
        ok, vals, err = read_block(client, "hr", 0, 100, "HR", unit)
        if ok:
            nonzero = [(i, v) for i, v in enumerate(vals) if v != 0]
            print(f"      Total registers: 100, Non-zero: {len(nonzero)}")
            if nonzero:
                print(f"      Non-zero registers:")
                for i, v in nonzero[:30]:
                    print(f"        HR[{i:3d}] = {v:5d}  (0x{v:04X})")
                if len(nonzero) > 30:
                    print(f"        ... and {len(nonzero)-30} more")
        else:
            print(f"       {err}")
        
        # Wider scan - IR 0-99
        print(f"\n  --- Wider scan: Input Registers 0-99 ---")
        ok, vals, err = read_block(client, "ir", 0, 100, "IR", unit)
        if ok:
            nonzero = [(i, v) for i, v in enumerate(vals) if v != 0]
            print(f"      Total registers: 100, Non-zero: {len(nonzero)}")
            if nonzero:
                print(f"      Non-zero registers:")
                for i, v in nonzero[:30]:
                    print(f"        IR[{i:3d}] = {v:5d}  (0x{v:04X})")
                if len(nonzero) > 30:
                    print(f"        ... and {len(nonzero)-30} more")
        else:
            print(f"      ❌ {err}")
        
        # Try different unit IDs (1-10)
        print(f"\n  --- Testing different Unit IDs (1-10) on HR[0] ---")
        for uid in range(1, 11):
            ok, vals, err = read_block(client, "hr", 0, 1, "HR", uid)
            status = "OK" if ok else f"ERR: {err}"
            val_str = f"val={vals[0]}" if ok and vals else ""
            print(f"      Unit ID {uid:2d}: {status} {val_str}")
        
    except Exception as e:
        print(f"  ❌ Exception: {e}")
    finally:
        client.close()
        print(f"\n  Connection closed.")

if __name__ == "__main__":
    print("Modbus Diagnostic Scanner")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    for dev in DEVICES:
        scan_device(dev)
    
    print(f"\n{'='*70}")
    print("Scan complete.")
