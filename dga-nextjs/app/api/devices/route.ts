import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Device IP mappings
const DEVICE_IPS: Record<string, string> = {
  'DA115': '10.31.204.5',
  'KT1A': '10.31.204.6',
  'KT2A': '10.31.204.7',
  'KT3A': '10.31.204.8',
  '09BAT02': '10.31.204.9',
  'ENB-101-A': '10.31.204.10',
  'ENB-101-B': '10.31.204.11',
  'TR_1D-VSD': '10.31.204.12',
  'TR_1A': '10.31.204.13',
  'TR_1B': '10.31.204.14',
  'DA04': '10.31.204.15',
  'DA05': '10.31.204.16',
  'DA07': '10.31.204.17',
  'DA08': '10.31.204.18',
  'DA09': '10.31.204.19',
  '34BAT02': '10.31.204.20',
  '11BAT01': '10.31.204.21',
  '12BAT01': '10.31.204.22',
  '15BAT01': '10.31.204.23',
  '16BAT01': '10.31.204.24',
  'TR_B2-1001': '10.31.204.25',
  'TR_B2-1002': '10.31.204.26',
};

const ALL_DEVICES = [
  { name: 'DA115', ip: DEVICE_IPS['DA115'], type: 'DA' },
  { name: 'KT1A', ip: DEVICE_IPS['KT1A'], type: 'KT' },
  { name: 'KT2A', ip: DEVICE_IPS['KT2A'], type: 'KT' },
  { name: 'KT3A', ip: DEVICE_IPS['KT3A'], type: 'KT' },
  { name: '09BAT02', ip: DEVICE_IPS['09BAT02'], type: 'BAT' },
  { name: 'ENB-101-A', ip: DEVICE_IPS['ENB-101-A'], type: 'ENB' },
  { name: 'ENB-101-B', ip: DEVICE_IPS['ENB-101-B'], type: 'ENB' },
  { name: 'TR_1D-VSD', ip: DEVICE_IPS['TR_1D-VSD'], type: 'TR' },
  { name: 'TR_1A', ip: DEVICE_IPS['TR_1A'], type: 'TR' },
  { name: 'TR_1B', ip: DEVICE_IPS['TR_1B'], type: 'TR' },
  { name: 'DA04', ip: DEVICE_IPS['DA04'], type: 'DA' },
  { name: 'DA05', ip: DEVICE_IPS['DA05'], type: 'DA' },
  { name: 'DA07', ip: DEVICE_IPS['DA07'], type: 'DA' },
  { name: 'DA08', ip: DEVICE_IPS['DA08'], type: 'DA' },
  { name: 'DA09', ip: DEVICE_IPS['DA09'], type: 'DA' },
  { name: '34BAT02', ip: DEVICE_IPS['34BAT02'], type: 'BAT' },
  { name: '11BAT01', ip: DEVICE_IPS['11BAT01'], type: 'BAT' },
  { name: '12BAT01', ip: DEVICE_IPS['12BAT01'], type: 'BAT' },
  { name: '15BAT01', ip: DEVICE_IPS['15BAT01'], type: 'BAT' },
  { name: '16BAT01', ip: DEVICE_IPS['16BAT01'], type: 'BAT' },
  { name: 'TR_B2-1001', ip: DEVICE_IPS['TR_B2-1001'], type: 'TR' },
  { name: 'TR_B2-1002', ip: DEVICE_IPS['TR_B2-1002'], type: 'TR' },
];

export async function GET(request: NextRequest) {
  try {
    // Return static device list with IP addresses
    return NextResponse.json({
      success: true,
      devices: ALL_DEVICES
    });
  } catch (error) {
    console.error('Devices API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}