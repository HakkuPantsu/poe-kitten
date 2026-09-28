---
title: OCR Guide
---

This guide helps you set up and use OCR in POE Kitten.

### OCR Setup

1. Download the ~6MB OCR archive from
   [here](https://github.com/SnosMe/awakened-poe-trade/releases/download/v3.20.10007/cv-ocr.zip).

2. Open your POE Kitten config folder:
   `%APPDATA%\poe-kitten\apt-data\`

   For reference, this is the equivalent folder location shown in the app:
   ![](/reference-images/toolbar-config.png)

3. Extract the `cv-ocr` folder from the archive into it.
   You should end up with this structure:

   ```
   apt-data/
   ├── config.json
   └── cv-ocr/
      ├── eng.traineddata
      ├── ... more files ...
      └── tesseract-core-simd.wasm
   ```

4. Restart POE Kitten.

### Widget configuration

1. Open the dashboard with `Shift` + `Space`, then pick the tool you want to
   place. The launcher shows every available tool:

   ![POE Kitten dashboard](/images/dashboard.png)

   I prefer to place the widget at the bottom of the screen.

2. Open **Settings → Hotkeys** and bind a key to the widget action.

   ![Hotkeys settings](/images/hotkeys.png)

### Rules to follow before pressing the hotkey

1. Both icons should be fully visible.

2. The text should not be occluded by the health bar or other UI elements.

Happy hunting!
