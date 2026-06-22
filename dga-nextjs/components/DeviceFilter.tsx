'use client';

import { useState } from 'react';

interface Device {
  name: string;
  ip: string;
  type: string;
}

interface DeviceFilterProps {
  devices: Device[];
  selectedDevices: string[];
  onSelectionChange: (devices: string[]) => void;
}

export default function DeviceFilter({
  devices,
  selectedDevices,
  onSelectionChange,
}: DeviceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const groupedDevices = devices.reduce((acc, device) => {
    if (!acc[device.type]) {
      acc[device.type] = [];
    }
    acc[device.type].push(device);
    return acc;
  }, {} as Record<string, Device[]>);

  const filteredDevices = Object.entries(groupedDevices).reduce(
    (acc, [type, typeDevices]) => {
      const filtered = typeDevices.filter((device) =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[type] = filtered;
      }
      return acc;
    },
    {} as Record<string, Device[]>
  );

  const handleToggle = (deviceName: string) => {
    if (selectedDevices.includes(deviceName)) {
      onSelectionChange(selectedDevices.filter((d) => d !== deviceName));
    } else {
      onSelectionChange([...selectedDevices, deviceName]);
    }
  };

  const handleSelectAll = () => {
    const allDeviceNames = Object.values(filteredDevices).flatMap((devices) =>
      devices.map((d) => d.name)
    );
    onSelectionChange(allDeviceNames);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors min-w-[200px] justify-between"
      >
        <span>Devices ({selectedDevices.length})</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-slate-700">
            <input
              type="text"
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 border-b border-slate-700 flex gap-2">
            <button
              onClick={handleSelectAll}
              className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-xs transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {Object.entries(filteredDevices).map(([type, typeDevices]) => (
              <div key={type} className="mb-2">
                <div className="text-xs font-semibold text-slate-400 px-2 py-1 bg-slate-700/50 rounded">
                  {type}
                </div>
                {typeDevices.map((device) => (
                  <label
                    key={device.name}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(device.name)}
                      onChange={() => handleToggle(device.name)}
                      className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                    />
                    <span className="text-sm text-white flex-1">{device.name}</span>
                    <span className="text-xs text-slate-400">{device.ip}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-700 text-xs text-slate-400">
            {selectedDevices.length} of {devices.length} selected
          </div>
        </div>
      )}
    </div>
  );
}