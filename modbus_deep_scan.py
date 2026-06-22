"""
Deep scan DA115 - more registers with signed interpretation
"""
import struct
from pymodbus.client import ModbusTcpClient

IP = "10.31.204.5"
client = ModbusTcpClient(IP, port=502, timeout=10)

def to_signed(val):
    """Convert 16-bit unsigned to signed"""
    if val >= 0x8000:
        return val - 0x10000
    return val

def to_float_32(high, low):
    """Convert two 16-bit registers to IEEE 754 float"""
    packed = struct.pack('>HH', high, low)
    return struct.unpack('>f', packed)[0]

def read_safe(client, func, addr, count, unit=1):
    try:
        if func == "hr":
            resp = client.read_holding_registers(addr, count=count, device_id=unit)
        elif func == "ir":
            resp = client.read_input_registers(addr, count=count, device_id=unit)
        if resp.isError():
            return None
        return resp.registers
    except:
        return None

if client.connect():
    print(f"Connected to DA115 ({IP})")
    
    # Scan HR 0-49
    print(f"\n{'='*70}")
    print("Holding Registers (FC03) - Full scan 0-49")
    print(f"{'='*70}")
    vals = read_safe(client, "hr", 0, 50)
    if vals:
        for i, v in enumerate(vals):
            signed = to_signed(v)
            bar = ""
            if v != 0:
                bar = f"  <-- 0x{v:04X} (signed: {signed})"
            print(f"  HR[{i:3d}] = {v:6d}{bar}")
    
    # Scan IR 0-49
    print(f"\n{'='*70}")
    print("Input Registers (FC04) - Full scan 0-49")
    print(f"{'='*70}")
    vals = read_safe(client, "ir", 0, 50)
    if vals:
        for i, v in enumerate(vals):
            signed = to_signed(v)
            bar = ""
            if v != 0:
                bar = f"  <-- 0x{v:04X} (signed: {signed})"
            print(f"  IR[{i:3d}] = {v:6d}{bar}")
    
    # Try float interpretation for consecutive pairs
    print(f"\n{'='*70}")
    print("Float interpretation (32-bit IEEE 754) - Input Registers")
    print(f"{'='*70}")
    vals = read_safe(client, "ir", 0, 50)
    if vals:
        for i in range(0, 49, 2):
            f = to_float_32(vals[i], vals[i+1])
            if abs(f) > 0.001 and abs(f) < 1e10:
                print(f"  IR[{i}:{i+1}] = {f:.4f}  (raw: 0x{vals[i]:04X}{vals[i+1]:04X})")
    
    # Also try HR as float
    print(f"\n{'='*70}")
    print("Float interpretation (32-bit IEEE 754) - Holding Registers")
    print(f"{'='*70}")
    vals = read_safe(client, "hr", 0, 50)
    if vals:
        for i in range(0, 49, 2):
            f = to_float_32(vals[i], vals[i+1])
            if abs(f) > 0.001 and abs(f) < 1e10:
                print(f"  HR[{i}:{i+1}] = {f:.4f}  (raw: 0x{vals[i]:04X}{vals[i+1]:04X})")
    
    client.close()
else:
    print("Failed to connect")
