# Storyboard — ai-add-tweaks-v1 (New-A / B)
Viewport 1920×1080, DPR 2, English UI, Home selected, Tweaks tab, canvas zoomed in enough that pricing + panel share the frame.

| # | Beat | Pointer / action | Expected result | Camera | Hold |
|---|------|------------------|-----------------|--------|------|
| 1 | Context | idle | Home + Tweaks; Add more tweaks form; pricing cards | global 1.0× | ~1.2 s |
| 2 | Input | glide → tweaks-ai-input; type `the pricing section` | text visible in field | push ~2.2× on AI form | type readable |
| 3 | Submit | click tweaks-ai-submit | button → Adding… / Asking the model… | hold on form | ~0.6 s then **CUT wait** |
| 4 | Knobs | (after jump) status Added N; new controls | labels readable | pan ~1.8× on new knob group | ~1.2 s |
| 5 | Toggle | click Price layout › Rows (or best visible) | artboard pricing layout/copy changes | push ~1.7× bridging panel→pricing | 0.5 s |
| 6 | Payoff | pointer parked | changed pricing readable | pull 1.0× | ≥3.0 s |

Edit: deliverable concatenates beats 1–3a + 4–6; GT markers record full `wait_latency_ms`.
