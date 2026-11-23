export const SMART_SLEEP_MONITOR_SLUG = 'thefuturex-smart-sleep-tracking-monitoring-system';

export const SMART_SLEEP_MONITOR_DESCRIPTION_HTML = `
  <h2>Contactless sleep monitoring from beneath your mattress</h2>
  <p><strong>Contactless Monitoring. Smart Sleep Insights. Connected Wellness.</strong></p>
  <p>The <strong>TheFutureX Smart Sleep Tracking Monitoring System</strong> is an under-mattress sleep monitor designed to help you review supported sleep quality, heart-rate, breathing-rate and body-movement information without wearing a watch, band or chest strap.</p>
  <p>Its slim sensor sits beneath a compatible mattress while the RemoteAngel companion app brings together available real-time readings, daily, weekly and monthly reports, and supported sleep-management settings. Bluetooth supports nearby app connection, while configured Wi-Fi supports remote access to available monitoring information.</p>
  <p>This product is intended for general sleep and wellness monitoring. It is not a medical device and must not be used to diagnose, treat, cure or prevent any condition, or to replace professional medical supervision or emergency care.</p>

  <h2>Key features</h2>
  <ul>
    <li><strong>Contactless under-mattress sensor:</strong> Monitor supported sleep signals without attaching a device to your body.</li>
    <li><strong>Sleep quality and movement insights:</strong> Review available sleep duration, quality, stage, movement and body-position-related information.</li>
    <li><strong>Heart-rate and breathing-rate trends:</strong> View supported readings and trends in the RemoteAngel app.</li>
    <li><strong>Bluetooth and Wi-Fi connectivity:</strong> Connect locally to a compatible phone and configure supported remote monitoring.</li>
    <li><strong>Reports over time:</strong> Review available daily, weekly and monthly records.</li>
    <li><strong>App-based alerts and routines:</strong> Configure supported heart-rate and breathing-rate thresholds, sleep plans, music and alarms.</li>
    <li><strong>Compact installation:</strong> The flexible sensor is made for flat placement beneath a compatible mattress.</li>
  </ul>

  <h2>How it works</h2>
  <p>Place the sensor flat beneath the mattress according to the positioning diagram in the manual. Do not bend, fold or place excessive pressure on it. Connect the sensor to the control unit, then connect a compatible 5V / 500mA Micro USB power supply.</p>
  <p>Download the <strong>RemoteAngel</strong> app on a compatible Android or iOS phone, enable Bluetooth, bind the detected device, then configure Wi-Fi in the app when remote access is required. Once installed and connected, use the monitoring screen and report section to review the supported information.</p>

  <h2>Sleep reports and connected monitoring</h2>
  <p>The RemoteAngel app provides available sleep duration, quality classification, sleep-stage information, heart-rate trends, breathing-rate trends, movement information and body-position-related information. Daily reports help you review a selected night, while weekly and monthly views help you identify longer-term changes.</p>
  <p>Its app interface also supports available sleep planning, sleep music, alarm settings and configurable monitoring thresholds. Remote access depends on network availability, device configuration and supported app functions.</p>

  <h2>Care and safety</h2>
  <ul>
    <li>Disconnect the power supply before cleaning and wipe external surfaces with a soft, dry cloth.</li>
    <li>Keep the sensor and control unit dry. Do not immerse either component in water or use harsh chemicals.</li>
    <li>Keep the sensor flat, away from excessive heat, vibration and moving beds or hammocks.</li>
    <li>Nearby fans, washing machines, loud music and other vibration sources can affect monitoring accuracy.</li>
    <li>Do not use the sensor with electric blankets or high-temperature equipment, and do not use damaged cables, sensors or control units.</li>
  </ul>

  <h2>Warranty and support</h2>
  <p><strong>6-month limited warranty</strong>, subject to the applicable TheFutureX warranty terms.</p>
  <p>For installation, connectivity or warranty support, email <a href="mailto:thefuturex.ptc@gmail.com">thefuturex.ptc@gmail.com</a> or call <a href="tel:+918530340676">8530340676</a>.</p>
`;

export const SMART_SLEEP_MONITOR_SPECS: Record<string, string> = {
  Brand: 'TheFutureX',
  'Product Name': 'Smart Sleep Tracking Monitoring System',
  'Device Type': 'Contactless sleep monitoring device',
  'Monitoring Method': 'Under-mattress sensor',
  'Heart Rate Monitoring': 'Supported',
  'Breathing Rate Monitoring': 'Supported',
  'Sleep Quality Monitoring': 'Supported',
  'Sleep Movement Monitoring': 'Supported',
  'Companion App': 'RemoteAngel',
  Bluetooth: 'BLE',
  'Wi-Fi Connectivity': 'Supported',
  'Remote Monitoring': 'Supported after Wi-Fi configuration',
  'Sleep Reports': 'Daily, weekly and monthly',
  'Sleep Planning': 'Supported through the app',
  'Alarm Settings': 'Supported through the app',
  'Control Box Dimensions': '72 × 72 × 13.5 mm',
  'Sensor Dimensions': '1000 × 53 × 0.35 mm',
  Weight: '185 g',
  'Power Supply': '5V / 500mA',
  'Power Interface': 'Micro USB',
  'Communication Range': 'Up to 10 metres visible range (manual specification)',
  Android: 'Android 4.3 or later (manual specification)',
  iOS: 'iOS 6.0 or later (manual specification)',
  Warranty: '6-month limited warranty',
};

export const SMART_SLEEP_MONITOR_FAQS = [
  { q: 'What does TheFutureX Smart Sleep Tracking Monitoring System monitor?', a: 'It monitors supported sleep-related signals, including sleep quality, heart rate, breathing rate and body movement.' },
  { q: 'Do I need to wear the device while sleeping?', a: 'No. The system uses an under-mattress sensor, so no wearable device, watch or chest strap is required.' },
  { q: 'Can it monitor heart rate and breathing rate?', a: 'Yes. The product supports heart-rate and breathing-rate monitoring through the RemoteAngel app.' },
  { q: 'Which app works with the sleep monitor?', a: 'The product uses the RemoteAngel companion app for device connection, supported monitoring information and reports.' },
  { q: 'Can I connect it to my smartphone?', a: 'Yes. It supports Bluetooth connectivity with a compatible smartphone and the RemoteAngel app.' },
  { q: 'Does the system support Wi-Fi?', a: 'Yes. Wi-Fi can be configured for supported remote-monitoring functions.' },
  { q: 'Can family members view monitoring information remotely?', a: 'The manual describes remote monitoring and device-binding and sharing functions. Availability depends on app configuration, connectivity and supported features.' },
  { q: 'Does it provide sleep reports?', a: 'Yes. The app supports available daily, weekly and monthly sleep reports.' },
  { q: 'Can it monitor two people at once?', a: 'No. The manual states that it monitors one person’s movement. Separate devices are required for simultaneous individual monitoring.' },
  { q: 'Is it suitable for elderly care?', a: 'It can provide general wellness information for families and caregivers, but it must not replace medical supervision, emergency-response systems or professional care.' },
  { q: 'Does the device need charging?', a: 'The supplied manual specifies a 5V / 500mA Micro USB power connection and does not confirm an internal rechargeable battery.' },
  { q: 'Can it detect sleep movement?', a: 'Yes. The application provides supported movement-related information.' },
  { q: 'Does it include alarms or sleep music?', a: 'The RemoteAngel app includes supported alarm, sleep-planning and sleep-music functions.' },
  { q: 'How should I clean the device?', a: 'Disconnect its power supply and gently clean external surfaces with a soft, dry cloth. Keep the sensor and electrical components dry.' },
  { q: 'What should I do if Bluetooth will not connect?', a: 'Check that Bluetooth is enabled and the device has power, restart the app, then repeat the pairing process if needed.' },
  { q: 'What can affect monitoring accuracy?', a: 'Check that the sensor is flat and positioned correctly. Excessive vibration from nearby appliances, fans or moving beds may affect readings.' },
  { q: 'What warranty is included?', a: 'The product includes a 6-month limited warranty, subject to the applicable warranty terms.' },
];
