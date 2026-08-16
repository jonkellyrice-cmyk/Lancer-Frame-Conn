# Hardsuit — Pilot/Mech Occupancy

Future responsibility: own the player-facing relationship between a pilot and the mech they are currently occupying or have exited.

Planned behavior includes:

- determine whether the pilot is mounted, dismounted, or ejected;
- coordinate the transition from Frame Conn to Hardsuit when the pilot leaves the cockpit;
- place/show the pilot token when dismounting or ejecting;
- remove/hide the pilot token when mounting;
- preserve one coherent activation budget while control shifts between mech and pilot tokens;
- represent occupied/unoccupied mech state only where native Foundry Lancer lacks a sufficient representation;
- support future AI/NHP control handoff without conflating pilot absence with autonomous mech control.

This should be relationship state, not a decorative status icon.
