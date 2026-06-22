"""
Deep scan DA115 - smaller blocks to avoid timeout
"""
import struct
from pymodbus.client import ModbusTcpClient

IP = "10.31.204.5"
client = ModbusTcpClient(IP, port=502, timeout=15)

def to_signed(val):
    if val >= 0x8000:
        return val - 0x10000
    return val

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
    
    # Scan HR in blocks of 10
    print(f"\n{'='*70}")
    print("Holding Registers (FC03) - Blocks of 10")
    print(f"{'='*70}")
    for start in range(0, 50, 10):
        vals = read_safe(client, "hr", start, 10)
        if vals:
            for i, v in enumerate(vals):
                addr = start + i
                signed = to_signed(v)
                if v != 0:
                    print(f"  HR[{addr:3d}] = {v:6d}  (0x{v:04X}, signed: {signed})")
    
    # Scan IR in blocks of 10
    print(f"\n{'='*70}")
    print("Input Registers (FC04) - Blocks of 10")
    print(f"{'='*70}")
    for start in range(0, 50, 10):
        vals = read_safe(client, "ir", start, 10)
        if vals:
            for i, v in enumerate(vals):
                addr = start + i
                signed = to_signed(v)
                if v != 0:
                    print(f"  IR[{addr:3d}] = {v:6d}  (0x{v:04X}, signed: {signed})")
    
    # Float interpretation
    print(f"\n{'='*70}")
    print("Float interpretation (32-bit) - Input Registers pairs")
    print(f"{'='*70}")
    for start in range(0, 50, 10):
        vals = read_safe(client, "ir", start, 10)
        if vals:
            for i in range(0, 9, 2):
                addr = start + i
                f = struct.unpack('>f', struct.pack('>HH', vals[i], vals[i+1]))[0]
                if 0.001 < abs(f) < 1e8:
                    print(f"  IR[{addr}:{addr+1}] = {f:.4f}")
    
    client.close()
    print("\nDone.")
else:
    print("Failed to connect")
