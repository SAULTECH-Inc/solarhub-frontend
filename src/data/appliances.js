export const APPL_DB = {
  'Air Conditioning': [
    { n: '0.75HP Window A/C', w: 560 }, { n: '1HP Window A/C', w: 900 },
    { n: '1HP Inverter A/C', w: 700 }, { n: '1.5HP Window A/C', w: 1100 },
    { n: '1.5HP Inverter A/C', w: 900 }, { n: '2HP Window A/C', w: 1800 },
    { n: '2HP Inverter A/C', w: 1500 }, { n: '3HP Inverter A/C', w: 2200 },
    { n: '3HP Window A/C', w: 2500 },
  ],
  'Refrigeration': [
    { n: '60L Mini Fridge', w: 60 }, { n: '100L Refrigerator', w: 80 },
    { n: '170L Refrigerator', w: 150 }, { n: '250L Refrigerator', w: 200 },
    { n: '400L Double Door Fridge', w: 350 }, { n: '100L Chest Freezer', w: 100 },
    { n: '200L Chest Freezer', w: 180 }, { n: '350L Chest Freezer', w: 250 },
    { n: 'Commercial Display Freezer', w: 400 },
  ],
  'Fans & Ventilation': [
    { n: 'Desk Fan', w: 35 }, { n: 'Standing Fan', w: 75 },
    { n: 'Ceiling Fan', w: 60 }, { n: 'Industrial/Wall Fan', w: 150 },
    { n: 'Exhaust Fan', w: 40 }, { n: 'Tower Fan', w: 55 },
  ],
  'Lighting': [
    { n: 'LED Bulb (9W)', w: 9 }, { n: 'LED Bulb (15W)', w: 15 },
    { n: 'LED Bulb (20W)', w: 20 }, { n: 'LED Bulb (30W)', w: 30 },
    { n: 'Fluorescent Tube (36W)', w: 36 }, { n: 'LED Floodlight (50W)', w: 50 },
    { n: 'LED Floodlight (100W)', w: 100 }, { n: 'LED Strip Lights (5m)', w: 20 },
    { n: 'Outdoor Security Light', w: 45 },
  ],
  'Entertainment': [
    { n: '32" LED TV', w: 40 }, { n: '43" LED TV', w: 80 },
    { n: '55" LED TV', w: 120 }, { n: '65" OLED TV', w: 160 },
    { n: 'Decoder / Set-top Box', w: 15 }, { n: 'Home Theatre System', w: 200 },
    { n: 'Soundbar', w: 50 }, { n: 'Gaming Console', w: 150 },
  ],
  'Kitchen Appliances': [
    { n: 'Microwave Oven', w: 1000 }, { n: 'Electric Kettle (1.5L)', w: 1500 },
    { n: 'Electric Kettle (3L)', w: 2000 }, { n: 'Electric Rice Cooker', w: 700 },
    { n: 'Blender', w: 400 }, { n: 'Toaster', w: 800 },
    { n: 'Coffee Maker', w: 900 }, { n: 'Juicer', w: 400 },
    { n: 'Electric Cooker (1 plate)', w: 1000 },
  ],
  'Office & Computing': [
    { n: 'Laptop Charger', w: 65 }, { n: 'Desktop Computer + Monitor', w: 250 },
    { n: 'Monitor (24")', w: 30 }, { n: 'Wi-Fi Router', w: 15 },
    { n: 'Network Switch (8-port)', w: 30 }, { n: 'Laser Printer', w: 400 },
    { n: 'CCTV System (4 cameras)', w: 50 }, { n: 'CCTV System (8 cameras)', w: 90 },
    { n: 'NVR / DVR Recorder', w: 25 },
  ],
  'Water & Pumps': [
    { n: '0.5HP Water Pump', w: 375 }, { n: '1HP Water Pump', w: 750 },
    { n: '1.5HP Submersible Pump', w: 1100 }, { n: '2HP Borehole Pump', w: 1500 },
    { n: 'Washing Machine (Front Load)', w: 500 }, { n: 'Washing Machine (Top Load)', w: 800 },
    { n: 'Water Heater (30L)', w: 2000 }, { n: 'Water Heater (80L)', w: 3000 },
  ],
  'Phones & Charging': [
    { n: 'Phone Charger', w: 10 }, { n: 'Tablet Charger', w: 20 },
    { n: 'Laptop (65W)', w: 65 }, { n: 'USB Charging Hub (4-port)', w: 50 },
    { n: 'Electric Toothbrush Dock', w: 5 },
  ],
  'Medical & Other': [
    { n: 'CPAP Machine', w: 100 }, { n: 'Oxygen Concentrator', w: 300 },
    { n: 'Small Medical Fridge', w: 80 }, { n: 'Electric Breast Pump', w: 50 },
    { n: 'Blood Pressure Monitor', w: 5 }, { n: 'Electric Iron', w: 1000 },
  ],
};

export function getAppIcon(nm) {
  const n = nm.toLowerCase();
  if (n.includes('a/c') || n.includes('air con')) return '❄️';
  if (n.includes('fridge') || n.includes('refriger')) return '🧊';
  if (n.includes('freezer')) return '🧊';
  if (n.includes('fan')) return '💨';
  if (n.includes('bulb') || n.includes('tube') || n.includes('strip') || n.includes('flood')) return '💡';
  if (n.includes('tv') || n.includes('telev') || n.includes('decoder') || n.includes('theatre')) return '📺';
  if (n.includes('laptop') || n.includes('desktop') || n.includes('monitor')) return '💻';
  if (n.includes('pump') || n.includes('borehole')) return '💧';
  if (n.includes('microwave') || n.includes('oven') || n.includes('cooker')) return '📦';
  if (n.includes('kettle') || n.includes('coffee')) return '☕';
  if (n.includes('phone') || n.includes('tablet') || n.includes('charging')) return '🔋';
  if (n.includes('router') || n.includes('wifi') || n.includes('switch') || n.includes('cctv')) return '📡';
  if (n.includes('wash')) return '🫧';
  if (n.includes('heater')) return '🌡️';
  if (n.includes('iron')) return '👔';
  if (n.includes('printer')) return '🖨️';
  return '⚡';
}

export function toWatts(pow, unit) {
  if (!pow) return 0;
  switch (unit) {
    case 'VA':  return pow * 0.8;
    case 'kW':  return pow * 1000;
    case 'kVA': return pow * 800;
    case 'A':   return pow * 230;
    default:    return pow;
  }
}
