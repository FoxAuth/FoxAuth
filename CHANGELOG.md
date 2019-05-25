# Changelog
All changes per revisioning to this project will be documented in this file. All dates used in this file are recorded as UTC+8.

## v 1.5.2 - May 23rd 2019
### New 💡
- remove account on popup directly
- French (fr) locale added
- account names are now displayed on popup (you can now search them as well)
- several new service icons (over 100 collected now)
### Removed 🚫
- popup button to token page (use issuer icon instead)

## v 1.5.1 - May 15th 2019
### New 💡
- several new service icons
### Fixed 🔨
- added some missing strings & fixed some typos

## v 1.5.0 - May 12th 2019
### New 💡
- i18n support, with the following locales added: Simplified Chinese (zh_CN), Traditional Chinese (zh_TW), Japanese (ja_JP)
- shortcut to open popup content in Firefox sidebar
- go-to-top button in popup
### Changes 📝
- new logo design & new addon name
### Fixed 🔨
- popup icon viewport will now be resized properly
- serveral website autofill refine

---

## v 1.4.11 - Apr 13th 2019
### New 💡
- Steam OTP code support
- service icons for Atlassian, PayPal, BitWarden, Phantom & the default fallback one
### Changes 📝
- default shortcut for opening popup changed to F8
### Fixed 🔨
- get rid of unnecessary autofills
- autofill adaption to Atlassian & IFTTT
- badge text is more persistant
- other minor refine
### Removed 🚫
- shorcut to autofill OTP code removed per upstream Firefox bug

## v 1.4.10 - Mar 30th 2019
- multiple minor fixes

## v 1.4.9 - Mar 28th 2019
### New 💡
- several new website icons & autofill support
### Changes 📝
- autofill will now try to return without comparing account name if it can
### Fixed 🔨
- can't scan QR in certain cases

## v 1.4.8 - Mar 26th 2019
### New 💡
- massive amount of new service icons
- badge text as number of accounts added
- autofill support on much more sites
- keyboard shortcut for OTP code filling & opening popup
### Changes 📝
- context menu items use SVG icons

## v 1.4.7 - Mar 1st 2019
- emergency hotfix

## v 1.4.6 - Feb 27th 2019
- multiple minor fixes

## v 1.4.5 - Feb 19th 2019
### New 💡
- button for manual copying
### Changes 📝
- Container tab is now not compulsory for multi-account but still supported
### Fixed 🔨
- hack into Reddit iFrame for autofilling

## v 1.4.4 - Feb 9th 2019
- hotfix addressing PreSearch

## v 1.4.3 - Jan 18th 2019
- small fixes & icons refine

## v 1.4.2 - Jan 8th 2019
### New 💡
- new logo design
### Changes 📝
- faster sync intervals
- small fixes

## v 1.4.1 - Nov 22th 2018
- hotfix for Slack.

## v 1.4.0 - Nov 15th 2018
### Changes 📝
- change QR scanning dependency to fix some errors.
### Fixed 🔨
- OTP urls with space are not recognized.

---

## v 1.3.1 - Nov 13th 2018
- hotfix for Protonmail & Reddit.

## v 1.3.0 - Nov 10th 2018
### New 💡
- Android QR scanning masking and quitting button.
### Fixed 🔨
- button for TOTP code filling on popup isn't working properly on Android.
### Changes 📝
1. changes on popup buttons:
    - website icons are now used to edit forms linking instead of numbers.
    - numbers are now used to correspond code filling.
1. code ES modulized to improve performance.
1. autohide no longer shows up when only one account exists.

---

## v 1.2.7 - Nov 7th 2018
### New 💡
- camera access on Firefox Android.
### Fixed 🔨
1. checkboxes on general options page don't actually do anything.
1. some unnecessary autofill.
1. button for QR scanning on popup isn't working properly on Android.
### Changes 📝
- Container icons are now colorized on Firefox desktop.
### Known issues 🐛
1. FxA sync not working yet.
1. autofill may not work on some sites.

## v 1.2.6 - Nov 6th 2018
### New 💡
- button for control on popup autohide.
### Fixed 🔨
1. logic improvement for sync & import.
1. bugs on popup autohide.
### Removed 🚫
- confirm page after QR scanning is now removed.
### Known issues 🐛
1. FxA sync not working yet.
1. autofill may not work on some sites.

## v 1.2.5 - Nov 6th 2018
### New 💡
- message bar for account added.
### Changes 📝
- import and other logic changes.
### Known issues 🐛
1. FxA sync not working yet.
1. autofill may not work on some sites.

## v 1.2.4 - Nov 5th 2018
### Fixed 🔨
1. search result won't update on search string cleared.
1. icon for Backup & Sync page.
1. decryption error when store password for only one browser session.
### Known issues 🐛
1. FxA sync not working yet.
1. autofill may not work on some sites.

>1.2.3 is skipped due to release accident

## v 1.2.2 - Nov 5th 2018
### Fixed 🔨
- sync hot-fix.
### Changes 📝
- new icon for Secret Tokens page.

## v 1.2.1 - Nov 5th 2018
### Fixed 🔨
- bugs when editing info on Secret Tokens page.

## v 1.2.0 - Nov 5th 2018
### New 💡
- clear search button.
### Changes 📝
1. min_ver raised to 60+.
1. sync will work in diff mode.
1. other minor changes.
### Fixed 🔨
1. autofill may fail on CloudFlare.
1. sync will now process deletion.
### Known issues 🐛
1. FxA sync not working yet.
1. autofill may not work on some sites.

---

## v 1.1.2 - Nov 3rd 2018
### New 💡
- import database manually.
  - import from any other authenticators is not yet supported.
### Known issues 🐛
1. FxA sync not working yet.
1. Dropbox sync won't process deletion.
1. autofill may not work on some sites.

## v 1.1.1 - Nov 2nd 2018
### Fixed 🔨
- autofill hotfix

## v 1.1.0 - Nov 1st 2018
### New 💡
1. export database manually.
1. autohide irrelevant account in popup.
### Fixed 🔨
1. icons display for z.cn, AWS and WordPress.
1. QR scanning failure in certain cases.
1. autofill failure in certain cases.
### Known issues 🐛
1. No mean to import database manually yet.
1. FxA sync not working yet.
1. Dropbox sync won't process deletion.
1. Autofill may not work on some sites.

---

## v 1.0.4 - Oct 31st 2018
### New 💡
- button for completely decrypting.
### Changes 📝
1. Container name will be fetched upon QR scanning.
1. other minor changes.
1. new icon for IFTTT.
### Fixed 🔨
1. can't scan QR via context menu.
1. UI doesn't look right on Android.
1. autofill failure in Container tabs.
### Known issues 🐛
1. No mean to import/export database manually yet.
1. FxA sync not working yet.
1. Dropbox sync won't process deletion.
1. Autofill may not work on some sites.

## v 1.0.3 - Oct 30th 2018
### New 💡
- new popup content when no account info found.
### Changes 📝
1. popup now catches error from invalid secret tokens.
1. new icon for QR scanning.
### Fixed 🔨
- potential secret tokens error.
### Known issues 🐛
1. No mean to decrypt database completely yet.
1. No mean to import/export database manually yet.
1. FxA sync not working yet.
1. Dropbox sync won't process deletion.
1. Autofill may not work on some sites.

## v 1.0.2 BETA - Oct 29th 2018
### Fixed 🔨
1. QR scanning error on some sites.
1. Hiding/showing buttons for secret tokens no longer navigate to "#".
1. Secret tokens process error in some cases.
### Known issues 🐛
1. No mean to decrypt database completely yet.
1. No mean to import/export database manually yet.
1. FxA sync not working yet.
1. Dropbox sync won't process deletion.
1. Autofill may not work on some sites.

## v 1.0.1 BETA - Oct 29th 2018
### Changes 📝
- No more built-in examples to avoid some problems.
### Known issues 🐛
1. No mean to decrypt database completely yet.
1. No mean to import/export database manually yet.
1. FxA sync not working yet.
1. Dropbox sync won't process deletion.
1. Autofill may not work on some sites.

## v 1.0.0 BETA - Oct 29th 2018
### New 💡
- First release as a public beta 🎉. Pls **DO** use with caution & careful backup.
### Known issues 🐛
1. No mean to decrypt database completely yet.
1. No mean to import/export database manually yet.
1. FxA sync not working yet.
1. Dropbox sync won't process deletion.
1. Autofill may not work on some sites.