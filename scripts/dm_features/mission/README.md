# Mission Feature Family

This directory will contain the GM-facing **Mission Toolkit**. Its job is to make mission planning data useful during play and make live-play developments useful during debrief and future mission planning.

The planned stages are:

1. `briefing/` — situation, goals, stakes, intelligence, and player-facing briefing material.
2. `preparation/` — approach, planning, loadout/intelligence review, contingencies, and pre-deployment choices.
3. `reserves/` — mission reserves, support assets, strategic advantages, availability, use, and expiration.
4. `boots_on_the_ground/` — live mission dashboard for objectives, complications, discoveries, scenes, encounters, and mission-state changes.
5. `debrief/` — success/failure state, unresolved consequences, rewards, repairs/downtime handoff, faction/world changes, and hooks for the next mission.

This family will have a dedicated DM-facing UI under `styles/ui_dm/`; it should not render inside the player Frame Conn cockpit.
