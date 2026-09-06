# Wave 1 and Wave 2 bulk catalog submission

This bundle proposes 49 public Alexbeav PSX setup kits and corrects BIOS/source metadata for two approved entries.
The owner authorized public submission and waived additional installation, generation, build, gameplay, relaunch and native-platform tests.
No waived test is reported as passed. Maintainers control approval and catalog publication.

## Preparation evidence

- All 49 public Windows package sizes and SHA-256 digests match their GitHub release assets.
- Each launch name matches the executable at its package root and the release source CMake configuration.
- All 57 disc identities contain CRC32, MD5, SHA-1, SHA-256, sizes, filenames and CUE track counts.
- Existing disc hashes match locally measured owned inputs; additional-disc hashes are new local measurements.
- All 14 discs across the six multi-disc games have SYSTEM.CNF boot serials matching the recorded disc set.
- Split data-track identities use the CUE boundary within a merged owned BIN where necessary.
- Source commits are fixed to public release tags; BIOS identities are explicit and Netplay is omitted.
- No retail files, BIOS bytes, generated game code or private input paths appear in this bundle.

## Known limits

The seven SCPH5552 titles remain affected by RetComM v0.6.35 generated-source detection.
Their manifests disclose this issue and remain in this submission under the owner waiver.
Mac archives retain generators targeting macOS 15 and external Homebrew SDL3 dependencies.
Native Linux/macOS installs, disc swaps and new full launcher runs remain unverified.

Metal Slug X and Valkyrie Profile already have catalog entries from other authors.
The proposed entries use separate catalog IDs and install directories; they do not replace those authors.
Please decide how to represent these alternate sources during bulk review.

The Xena and AC3 USA corrections implement the explicit BIOS and source pins requested in issues #32 and #33.
Their earlier Windows acceptance remains separate from this batch waiver.

## Proposed titles

| Title | Public release | Discs | BIOS | Manifest |
|---|---|---:|---|---|
| Ace Combat 3: Electrosphere (Japan) | [v0.3.6](https://github.com/Alexbeav/ace-combat-3-electrosphere-recomp/releases/tag/v0.3.6) | 2 | SCPH1001 | [ace-combat-3-electrosphere-psx](../../titles/psx/ace-combat-3-electrosphere-psx.json) |
| Alien Resurrection | [v0.1.2](https://github.com/Alexbeav/alien-resurrection-recomp/releases/tag/v0.1.2) | 1 | SCPH5552 | [alien-resurrection-psx](../../titles/psx/alien-resurrection-psx.json) |
| Alone in the Dark: The New Nightmare | [v0.3.6](https://github.com/Alexbeav/alone-in-the-dark-the-new-nightmare-recomp/releases/tag/v0.3.6) | 2 | SCPH5552 | [alone-in-the-dark-the-new-nightmare-psx](../../titles/psx/alone-in-the-dark-the-new-nightmare-psx.json) |
| Alundra | [v0.3.6](https://github.com/Alexbeav/alundra-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [alundra-psx](../../titles/psx/alundra-psx.json) |
| Ape Escape | [v0.3.6](https://github.com/Alexbeav/ape-escape-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [ape-escape-psx](../../titles/psx/ape-escape-psx.json) |
| Armored Core | [v0.3.6](https://github.com/Alexbeav/armored-core-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [armored-core-psx](../../titles/psx/armored-core-psx.json) |
| Blood Omen: Legacy of Kain | [v0.3.6](https://github.com/Alexbeav/blood-omen-legacy-of-kain-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [blood-omen-legacy-of-kain-psx](../../titles/psx/blood-omen-legacy-of-kain-psx.json) |
| Bloody Roar II | [v0.1.2](https://github.com/Alexbeav/bloody-roar-ii-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [bloody-roar-ii-psx](../../titles/psx/bloody-roar-ii-psx.json) |
| Brave Fencer Musashi | [v0.1.2](https://github.com/Alexbeav/brave-fencer-musashi-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [brave-fencer-musashi-psx](../../titles/psx/brave-fencer-musashi-psx.json) |
| Colin McRae Rally 2.0 | [v0.3.6](https://github.com/Alexbeav/colin-mcrae-rally-2-0-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [colin-mcrae-rally-2-0-psx](../../titles/psx/colin-mcrae-rally-2-0-psx.json) |
| Destruction Derby 2 | [v0.3.6](https://github.com/Alexbeav/destruction-derby-2-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [destruction-derby-2-psx](../../titles/psx/destruction-derby-2-psx.json) |
| Diablo | [v0.1.2](https://github.com/Alexbeav/diablo-recomp/releases/tag/v0.1.2) | 1 | SCPH5552 | [diablo-psx](../../titles/psx/diablo-psx.json) |
| Die Hard Trilogy | [v0.3.6](https://github.com/Alexbeav/die-hard-trilogy-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [die-hard-trilogy-psx](../../titles/psx/die-hard-trilogy-psx.json) |
| Digimon World 2003 | [v0.3.6](https://github.com/Alexbeav/digimon-world-2003-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [digimon-world-2003-psx](../../titles/psx/digimon-world-2003-psx.json) |
| Driver | [v0.3.6](https://github.com/Alexbeav/driver-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [driver-psx](../../titles/psx/driver-psx.json) |
| Duke Nukem: Land of the Babes | [v0.3.6](https://github.com/Alexbeav/duke-nukem-land-of-the-babes-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [duke-nukem-land-of-the-babes-psx](../../titles/psx/duke-nukem-land-of-the-babes-psx.json) |
| Duke Nukem: Time to Kill | [v0.3.6](https://github.com/Alexbeav/duke-nukem-time-to-kill-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [duke-nukem-time-to-kill-psx](../../titles/psx/duke-nukem-time-to-kill-psx.json) |
| Fade to Black | [v0.3.6](https://github.com/Alexbeav/fade-to-black-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [fade-to-black-psx](../../titles/psx/fade-to-black-psx.json) |
| Fighting Force | [v0.1.2](https://github.com/Alexbeav/fighting-force-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [fighting-force-psx](../../titles/psx/fighting-force-psx.json) |
| In Cold Blood | [v0.3.6](https://github.com/Alexbeav/in-cold-blood-recomp/releases/tag/v0.3.6) | 2 | SCPH1001 | [in-cold-blood-psx](../../titles/psx/in-cold-blood-psx.json) |
| Jackie Chan Stuntmaster | [v0.1.2](https://github.com/Alexbeav/jackie-chan-stuntmaster-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [jackie-chan-stuntmaster-psx](../../titles/psx/jackie-chan-stuntmaster-psx.json) |
| King's Field | [v0.3.6](https://github.com/Alexbeav/kings-field-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [kings-field-psx](../../titles/psx/kings-field-psx.json) |
| Koudelka | [v0.3.6](https://github.com/Alexbeav/koudelka-recomp/releases/tag/v0.3.6) | 4 | SCPH1001 | [koudelka-psx](../../titles/psx/koudelka-psx.json) |
| Kula World | [v0.3.6](https://github.com/Alexbeav/kula-world-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [kula-world-psx](../../titles/psx/kula-world-psx.json) |
| Legacy of Kain: Soul Reaver | [v0.1.2](https://github.com/Alexbeav/legacy-of-kain-soul-reaver-recomp/releases/tag/v0.1.2) | 1 | SCPH5552 | [legacy-of-kain-soul-reaver-psx](../../titles/psx/legacy-of-kain-soul-reaver-psx.json) |
| MDK | [v0.1.2](https://github.com/Alexbeav/mdk-recomp/releases/tag/v0.1.2) | 1 | SCPH5552 | [mdk-psx](../../titles/psx/mdk-psx.json) |
| MediEvil II | [v0.1.2](https://github.com/Alexbeav/medievil-ii-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [medievil-ii-psx](../../titles/psx/medievil-ii-psx.json) |
| MediEvil | [v0.1.2](https://github.com/Alexbeav/medievil-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [medievil-psx](../../titles/psx/medievil-psx.json) |
| Mega Man Legends | [v0.3.6](https://github.com/Alexbeav/mega-man-legends-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [mega-man-legends-psx](../../titles/psx/mega-man-legends-psx.json) |
| Men in Black: The Game | [v0.3.6](https://github.com/Alexbeav/men-in-black-the-game-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [men-in-black-the-game-psx](../../titles/psx/men-in-black-the-game-psx.json) |
| Metal Slug X | [v0.1.2](https://github.com/Alexbeav/metal-slug-x-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [metal-slug-x-alexbeav-psx](../../titles/psx/metal-slug-x-alexbeav-psx.json) |
| Monster Rancher 2 | [v0.1.2](https://github.com/Alexbeav/monster-rancher-2-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [monster-rancher-2-psx](../../titles/psx/monster-rancher-2-psx.json) |
| Nightmare Creatures | [v0.1.2](https://github.com/Alexbeav/nightmare-creatures-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [nightmare-creatures-psx](../../titles/psx/nightmare-creatures-psx.json) |
| Oddworld: Abe's Oddysee | [v0.1.2](https://github.com/Alexbeav/oddworld-abe-s-oddysee-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [oddworld-abe-s-oddysee-psx](../../titles/psx/oddworld-abe-s-oddysee-psx.json) |
| Parasite Eve | [v0.3.6](https://github.com/Alexbeav/parasite-eve-recomp/releases/tag/v0.3.6) | 2 | SCPH1001 | [parasite-eve-psx](../../titles/psx/parasite-eve-psx.json) |
| Quake II | [v0.1.2](https://github.com/Alexbeav/quake-ii-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [quake-ii-psx](../../titles/psx/quake-ii-psx.json) |
| Spyro the Dragon | [v0.1.2](https://github.com/Alexbeav/spyro-the-dragon-recomp/releases/tag/v0.1.2) | 1 | SCPH5552 | [spyro-the-dragon-psx](../../titles/psx/spyro-the-dragon-psx.json) |
| Syphon Filter 3 | [v0.1.2](https://github.com/Alexbeav/syphon-filter-3-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [syphon-filter-3-psx](../../titles/psx/syphon-filter-3-psx.json) |
| Tenchu Stealth Assassins | [v0.1.2](https://github.com/Alexbeav/tenchu-stealth-assassins-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [tenchu-stealth-assassins-psx](../../titles/psx/tenchu-stealth-assassins-psx.json) |
| The Lost World: Jurassic Park Special Edition | [v0.3.6](https://github.com/Alexbeav/the-lost-world-jurassic-park-special-edition-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [the-lost-world-jurassic-park-special-edition-psx](../../titles/psx/the-lost-world-jurassic-park-special-edition-psx.json) |
| The Mummy | [v0.3.6](https://github.com/Alexbeav/the-mummy-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [the-mummy-psx](../../titles/psx/the-mummy-psx.json) |
| Tony Hawk's Pro Skater 2 | [v0.1.2](https://github.com/Alexbeav/tony-hawk-s-pro-skater-2-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [tony-hawk-s-pro-skater-2-psx](../../titles/psx/tony-hawk-s-pro-skater-2-psx.json) |
| Tony Hawk's Pro Skater 3 | [v0.1.2](https://github.com/Alexbeav/tony-hawk-s-pro-skater-3-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [tony-hawk-s-pro-skater-3-psx](../../titles/psx/tony-hawk-s-pro-skater-3-psx.json) |
| Tony Hawk's Pro Skater 4 | [v0.1.2](https://github.com/Alexbeav/tony-hawk-s-pro-skater-4-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [tony-hawk-s-pro-skater-4-psx](../../titles/psx/tony-hawk-s-pro-skater-4-psx.json) |
| Tony Hawks Pro Skater | [v0.1.2](https://github.com/Alexbeav/tony-hawk-s-pro-skater-recomp/releases/tag/v0.1.2) | 1 | SCPH1001 | [tony-hawk-s-pro-skater-psx](../../titles/psx/tony-hawk-s-pro-skater-psx.json) |
| Valkyrie Profile | [v0.1.3](https://github.com/Alexbeav/valkyrie-profile-recomp/releases/tag/v0.1.3) | 2 | SCPH1001 | [valkyrie-profile-psx](../../titles/psx/valkyrie-profile-psx.json) |
| Vampire Hunter D | [v0.3.6](https://github.com/Alexbeav/vampire-hunter-d-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [vampire-hunter-d-psx](../../titles/psx/vampire-hunter-d-psx.json) |
| Vigilante 8 | [v0.3.6](https://github.com/Alexbeav/vigilante-8-recomp/releases/tag/v0.3.6) | 1 | SCPH1001 | [vigilante-8-psx](../../titles/psx/vigilante-8-psx.json) |
| WipEout | [v0.1.2](https://github.com/Alexbeav/wipeout-recomp/releases/tag/v0.1.2) | 1 | SCPH5552 | [wipeout-psx](../../titles/psx/wipeout-psx.json) |

Exact release asset identities and manifest SHA-256 values are in [receipt.json](receipt.json).

Developed with AI assistance. Preparation evidence is listed above; the waived tests remain unverified.
