# DualSync BT — Dual Bluetooth Audio Synchronization

> **"Two Devices. One Audio Experience."**

DualSync BT is a responsive, audio-control web application designed for desktop Google Chrome, Microsoft Edge, and Chrome for Android. It allows users to manage dual Bluetooth device connections, play local audio files with zero server uploads, adjust individual channel gains, configure sub-millisecond software delay compensation (-500 ms to +500 ms), and execute a 6-step guided manual synchronization calibration.

---

## 🎧 Architecture & Browser Reality Disclosure

### 1. Web Bluetooth API (BLE GATT) vs. Bluetooth Classic (A2DP)
* **What Web Bluetooth provides:** Secure communication with Bluetooth Low Energy (BLE) Generic Attribute Profile (GATT) peripherals (e.g. Battery Service UUID `0x180F`, device naming, telemetry).
* **What Web Bluetooth does NOT provide:** The browser's Web Bluetooth API **cannot** establish Bluetooth Classic A2DP audio transport streams to route music directly to headphones or speakers.
* **Dual Audio Solution:** Physical dual audio routing requires operating-system level Bluetooth controllers (e.g. Samsung Dual Audio on Android, macOS Multi-Output Aggregate Device in Audio MIDI Setup, or Windows stereo mixers). DualSync BT handles software delay compensation, volume scaling, and visual playback alignment.

### 2. Real Web Audio API Pipeline
* Signal path: `MediaElementAudioSourceNode` ➜ `MasterGainNode` ➜ Split into:
  * **Device 1 Branch:** `DelayNode` (0 to 500ms) ➜ `GainNode` (D1 Volume) ➜ ChannelMerger
  * **Device 2 Branch:** `DelayNode` (0 to 500ms) ➜ `GainNode` (D2 Volume) ➜ ChannelMerger
* Real-time `AnalyserNode` drives the 60fps canvas frequency spectrum visualizer.
* Calibration test tone: Synthesizes dual-harmonic sine/triangle tone pulses (880 Hz / 440 Hz) through the delay pipeline.

---

## 🚀 Key Features

* **Independent Device 1 & Device 2 Slots:** Separate state management, GATT connection triggers, battery level readouts (when exposed via BLE `0x180F`), and duplicate assignment prevention.
* **Local Music Player:** Supports MP3, WAV, FLAC, M4A, and OGG with client-side ID3 tag parsing (Title, Artist, Album, and embedded APIC cover art).
* **Built-in Procedural Audio Demo Tracks:** In-memory synthesized WAV tracks for instant testing without needing audio files on disk.
* **Individual Volume Control:** Master Volume, Device 1 Volume, Device 2 Volume sliders with tabular percentage formatting (`tabular-nums`).
* **Latency Compensation (-500ms to +500ms):** 10ms fine steps, instant reset, software delay buffer calculation, and device profile saving in `localStorage`.
* **6-Step Manual Synchronization Calibration:** Guided listening test with harmonic tone pulses and ear-calibrated alignment.
* **Capability Matrix:** Live detection of Web Bluetooth, Secure Context (HTTPS), `setSinkId()`, `enumerateDevices()`, and Web Audio API.
* **In-App Diagnostic Suite:** Automated test runner executing 10 validation specifications in real time.
* **Responsive Dark Theme UI:** Glassmorphism cards, deep navy canvas (`#080D1B`), dark structural surfaces (`#141B2D`), vibrant primary (`#6C63FF`) and secondary cyan (`#00D4FF`) accents.

---

## 🛠️ Local Development & Setup

### Prerequisites
* Node.js $\ge 18$
* Modern Chromium-based browser (Google Chrome, Microsoft Edge, or Chrome for Android)
* HTTPS or localhost (mandatory for Web Bluetooth security policies)

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in Google Chrome or Microsoft Edge.

### Run Unit Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```
The compiled static website will be created in the `dist/` directory.

---

## 📋 Operating System Multi-Bluetooth Audio Pairing

1. **Android (Samsung Galaxy / One UI):**
   * Swipe down Quick Settings ➜ Tap **Media Output**.
   * Select both paired Bluetooth devices under Audio Output.
   * Toggle Dual Audio to broadcast to both simultaneously.

2. **macOS:**
   * Open **Audio MIDI Setup** (under Applications ➜ Utilities).
   * Click **+** ➜ **Create Multi-Output Device**.
   * Check both connected Bluetooth devices.
   * Set this Multi-Output Device as system default output.

3. **Windows 11 / 10:**
   * Pair both Bluetooth devices in Windows Bluetooth settings.
   * Open Sound Settings ➜ Recording tab ➜ Enable **Stereo Mix**.
   * In Stereo Mix Properties ➜ Listen tab ➜ Check **Listen to this device** and set Playback through Device 2.
