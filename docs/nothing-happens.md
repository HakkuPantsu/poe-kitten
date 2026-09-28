---
title: Nothing happens when I try to price check
---

# Nothing happens when I try to price check

![POE Kitten dashboard](/images/dashboard.png)

To understand why nothing is happening, you need to open the logs.
Most problems are easy to fix once you read them. But there is one that doesn't have a quick fix:
```
warn [ClipboardPoller] No item text found.
```

## Make sure the item is actually being copied

POE Kitten doesn't read the item from your screen — it asks the game to copy the
hovered item to the clipboard, then parses that text. So if the clipboard copy
doesn't happen, nothing happens at all.

The usual cause is a **global keyboard shortcut** from another program swallowing
the key combo. Set your price check hotkey in **Settings → Hotkeys**:

![Hotkeys settings](/images/hotkeys.png)

POE Kitten also presses the game's own **"Advanced Descriptions"** key as part of
the copy, so that full modifier text is included. You can see and change it in
**Settings → Price check**.

**Your goal is to make PoE copy the item to the clipboard when you press your hotkey.**
If it already works, ignore this article — your problem is somewhere else.

Common programs reported by players as stealing the combo:

- ASUS GPU Tweak II
- Radeon™ Software
- Display Pilot (BenQ)
- AHK scripts
- Discord (clips)

## Check the logs

Turn on **Read client log** in **Settings → Chat & alerts**, which is also what
powers whispers, deaths and level-ups:

![Chat and alerts settings](/images/chat.png)

Then open the logs and price check an item. This is what a working check looks like —
you should see the item text being received, then the trade search running:

![Logs panel](/images/logs.png)

Your goal is not to make it look exactly like the screenshot, but to make sure that
**PoE copies the item to the clipboard with all mods**.
