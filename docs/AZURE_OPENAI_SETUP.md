# Azure OpenAI GPT-4o Configuration Guide

## Overview

เอกสารนี้แสดงวิธีตั้งค่าเครื่อง client ให้เรียกใช้ Azure OpenAI GPT-4o บน endpoint `irpc-openai-02.openai.azure.com` ได้ผ่าน IRPC VPN

## Architecture

```
┌─────────────┐     VPN (GlobalProtect)     ┌──────────────────┐
│  Machine    │ ────────────────────────── │  IRPC VNet       │
│  (Laptop/   │                              │  ┌──────────────┐│
│  Server)    │   hosts file override       │  │ 10.24.32.6   ││
│             │   DNS → Private IP          │  │ IRPC-OpenAI  ││
│             │   (NOT Public IP:443)       │  │   (Private)  ││
└─────────────┘                              │  └──────────────┘│
                                             └──────────────────┘
```

## ปัญหา

Azure Cognitive Services ถูกตั้งเป็น **Private Endpoint Only** — DNS public จะ resolve ไป public IP (เช่น 20.232.91.180) → Azure ตอบ 403:

```json
{
    "error": {
        "code": "403",
        "message": "A Virtual Network is configured for this resource."
    }
}
```

แม้จะต่อ GlobalProtect VPN แล้ว DNS ยังอาจ resolve เป็น public IP หาก DNS server ไม่ใช่ของ IRPC

## วิธีแก้

### ขั้นตอนที่ 1: หา Private IP ของ Endpoint

ใช้ Azure CLI จาก account ที่มีสิทธิ์อ่าน resource ใน subscription `IRPC-AI-Services`:

```bash
# Login (ต้องผ่าน MFA - จะเปิด web browser)
az login --tenant irpcplc.onmicrosoft.com
az account set --subscription 95328234-1ee6-40df-9fb2-d3b7dc048652

# หา private IP ทุก OpenAI endpoint
az network private-dns record-set a list \
  --subscription 95328234-1ee6-40df-9fb2-d3b7dc048652 \
  --zone-name privatelink.openai.azure.com \
  --resource-group $(az cognitiveservices account list \
    --subscription 95328234-1ee6-40df-9fb2-d3b7dc048652 \
    --query "[?name=='IRPC-OpenAI-02'].resourceGroup" -o tsv) \
  --query "[].{name:name, ip:aRecords[0].ipv4Address}" -o table
```

**ผลลัพธ์ตัวอย่าง:**
```
Name                       Ip
-------------------------  -----------
irpc-openai-02             10.24.32.6
irpc-openai-05             10.24.32.7
irpc-openai-07             10.24.32.8
irpc-openai-08             10.24.32.9
irpc-openai-10             10.24.32.10
irpc-openai-11             10.24.32.11
irpc-openai-13             10.24.32.12
```

### ขั้นตอนที่ 2: เพิ่ม /etc/hosts Entries

ใช้ `sudo tee -a` เท่านั้น (อย่าใช้ `sudo echo >>`) เพื่อรักษาสิทธิ์ของไฟล์:

```bash
echo 'Seiya010' | sudo -S tee -a /etc/hosts << 'HOSTS'

# Azure OpenAI - IRPC Private Endpoints
# ได้ IP จาก: az network private-dns record-set a list
10.24.32.6  irpc-openai-02.openai.azure.com
10.24.32.6  irpc-openai-02.privatelink.openai.azure.com
HOSTS
```

### ขั้นตอนที่ 3: Flush DNS Cache

```bash
echo 'Seiya010' | sudo -S resolvectl flush-caches
```

บน Windows: `ipconfig /flushdns`
บน macOS: `sudo killall -HUP mDNSResponder`

### ขั้นตอนที่ 4: ตรวจสอบ

```bash
# 1. DNS ต้อง resolve เป็น private IP
getent hosts irpc-openai-02.openai.azure.com
# Expected: 10.24.32.6

# 2. ทดสอบ API ด้วย curl
curl -s -X POST \
  "https://irpc-openai-02.openai.azure.com/openai/deployments/gpt-4o-deployment/chat/completions?api-version=2024-02-15-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: d4e72af9a59c4112bb4b7601d46fad5e" \
  -d '{"messages":[{"role":"user","content":"Say hello in Thai"}],"max_tokens":10}'

# Expected: {"choices":[{"message":{"content":"สวัสดีครับ"}}]}
```

## Quick Reference

### Endpoints
| Field | Value |
|-------|-------|
| **Endpoint URL** | `https://irpc-openai-02.openai.azure.com/` |
| **GPT-4o Deployment** | `gpt-4o-deployment` |
| **Model version** | `gpt-4o-2024-11-20` |
| **API Version** | `2024-02-15-preview` |
| **Private IP** | `10.24.32.6` |

### API Key
```
d4e72af9a59c4112bb4b7601d46fad5e
```
เก็บใน environment variable `AZURE_OPENAI_KEY` ห้าม hardcode ใน code

### Environment Variables
```bash
AZURE_OPENAI_KEY='d4e72af9a59c4112bb4b7601d46fad5e'
AZURE_OPENAI_ENDPOINT='https://irpc-openai-02.openai.azure.com/'
AZURE_OPENAI_DEPLOYMENT='gpt-4o-deployment'
AZURE_OPENAI_VERSION='2024-02-15-preview'
```

### Curl แบบ Streaming (real-time output)
```bash
curl -s -N -X POST \
  "https://irpc-openai-02.openai.azure.com/openai/deployments/gpt-4o-deployment/chat/completions?api-version=2024-02-15-preview" \
  -H "Content-Type: application/json" \
  -H "api-key: d4e72af9a59c4112bb4b7601d46fad5e" \
  -d '{"messages":[{"role":"user","content":"Hello world"}],"max_tokens":50,"stream":true}'
```

### System Prompt สำหรับ DGA Assistant
```
You are DGA Assistant, a helpful expert for Dissolved Gas Analysis monitoring systems.

Context:
- Users monitor power transformers via dissolved gas analysis (DGA)
- Key metrics: H2 (Hydrogen), CO (Carbon Monoxide), WC (Water Content) in ppm
- Z-Score indicates anomaly: Normal (<2σ), Warning (2-3σ), Critical (>3σ)
- Threshold typically set at ±3σ
- Devices include: DA115, DA08, DA04, DA05, DA07, DA09, KT1A, KT2A, KT3A

Rules:
- Respond in Thai if user asks in Thai, otherwise English
- Be concise and practical - users are electrical technicians/engineers
- Never make up data
```

## Troubleshooting

### 1. ได้ 403 "Virtual Network is configured"
**สาเหตุ:** DNS resolve ไป public IP
**แก้:** 
```bash
getent hosts irpc-openai-02.openai.azure.com
# ถ้าแสดง public IP → hosts file ถูก override หรือ cache ไม่ flush
# ถ้าแสดง private IP → hosts file ถูกต้อง แต่ยังไม่ flush
echo 'Seiya010' | sudo -S resolvectl flush-caches
```

### 2. DNS ยัง resolve ไป public IP ทั้งที่เพิ่ม hosts แล้ว
**สาเหตุ:** มีบรรทัดเก่าใน `/etc/hosts` ที่ map ไป public IP → **ต้องลบบรรทัดเก่านั้นออกก่อน**
```bash
sudo grep -n "20.232.91" /etc/hosts
# ถ้ามี → sudo nano /etc/hosts แล้วลบออก
```

### 3. hosts file เขียนไม่ได้
**ห้ามใช้:** `sudo echo '...' >> /etc/hosts` (จะทำให้ไฟล์เป็นของ root)
**ให้ใช้:** `echo '...' | sudo -S tee -a /etc/hosts`

### 4. VPN ต่อแล้ว แต่ ping不通 10.24.32.6
**สาเหตุ:** GlobalProtect ยังไม่ sync route table
**แก้:** Disconnect แล้ว reconnect VPN, รอสัก 30 วินาที
```bash
globalprotect disconnect
sleep 5
globalprotect connect
sleep 30
ping -c 2 10.24.32.6  # ควรได้ reply
```

### 5. ได้ timeout แทน 403
**สาเหตุ:** ไม่มี VPN → traffic ไป private IP ไม่ได้เลย
**แก้:** `globalprotect show --status` ต้องได้ `Connected`

## Setup เครื่องใหม่ Checklist

- [ ] ติดตั้ง GlobalProtect VPN
- [ ] `az login` ด้วย user ที่มีสิทธิ์อ่าน subscription
- [ ] `getent hosts irpc-openai-02.openai.azure.com` → ต้องได้ private IP
- [ ] เพิ่ม `/etc/hosts` entries
- [ ] `sudo resolvectl flush-caches`
- [ ] Test curl → ได้ response 200
- [ ] ตั้ง environment variables

## Private IP Reference Table

| Resource | Private IP | Location |
|----------|-----------|----------|
| IRPC-OpenAI-02 | `10.24.32.6` | eastus |
| IRPC-OpenAI-05 | `10.24.32.7` | australiaeast |
| IRPC-OpenAI-07 | `10.24.32.8` | australiaeast |
| IRPC-OpenAI-08 | `10.24.32.9` | australiaeast |
| IRPC-OpenAI-10 | `10.24.32.10` | eastus2 |
| IRPC-OpenAI-11 | `10.24.32.11` | eastus2 |
| IRPC-OpenAI-13 | `10.24.32.12` | eastus2 |

---

*เอกสารนี้สร้างเมื่อ 2026-07-16 | อัปเดตล่าสุด: initial*
