# Auth Plus Firefox TOTP Extension

<div align='center'>
  <img width='20%' height='20%' src='foxauth.svg'></img>
  <p>
  <strong>A Firefox authenticator that can autofill TOTP codes with Firefox Android support</strong>
  <br>
  <br>
  <a href="https://github.com/FoxAuth/FoxAuth/">
      <img src="https://img.shields.io/github/languages/code-size/FoxAuth/FoxAuth.svg?style=flat-square" alt="codesize" />
    </a>
  ·
    <a href="https://www.gnu.org/licenses/gpl-3.0.html">
      <img src="https://img.shields.io/github/license/FoxAuth/FoxAuth.svg?style=flat-square" alt="license" />
    </a>
  </a>
  ·
    <a href="https://t.me/joinchat/Flgxfkm5Q2c8JayWirYTmA">
      <img src="https://img.shields.io/badge/Telegram-Join%20Chat-red.svg?style=flat-square" alt="Telegram link" />
    </a>
      ·
    <a href="https://gitter.im/FoxAuth/Lobby">
      <img src="https://img.shields.io/badge/Gitter-Join%20Chat-purple.svg?style=flat-square" alt="Telegram link" />
    </a>

[![https://addons.mozilla.org/firefox/addon/foxauth](https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_2.png)](https://addons.mozilla.org/firefox/addon/foxauth)
</div>

## Introduction

Auth Plus is a [TOTP](https://wikipedia.org/wiki/Time-based_One-time_Password_algorithm) browser client with autofill support for __Firefox__ and __Firefox Android__

> 2FA made no longer annoying but enjoyable

## Features

- __Firefox Android__ support
- __Steam OTP__ code support 
- __QR code__ / manually add account info
- [__Container tab__](https://support.mozilla.org/en-US/kb/containers) support to autofill multiple same-domain accounts
- __import / export__
  - import from other authenticators (in progress)
    - [ ] [Authy](https://authy.com/)
    - [ ] [Google Authenticator](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
    - [ ] [Microsoft Authenticator](https://play.google.com/store/apps/details?id=com.azure.authenticator)
    - [ ] [LastPass Authenticator](https://play.google.com/store/apps/details?id=com.lastpass.authenticator)
    - [x] [Authenticator](https://github.com/Authenticator-Extension/Authenticator)

- (Password based) account list __encryption__
- Autofill __TOTP__ form
- __Dropbox /__ (in upcoming releases) __FxA__ sync
- [Photon Design](https://design.firefox.com/photon)

## Disclaimers

During sync, you are **NOT** supposed to do any of the listed behaviors or you are totally responsible for your data loss:

1. Moving, renaming, deleting or manually editting any file in our app folder (copying and pasting shall not cause issues though).
1. operate account info between several devices in a **REALLY** frequent rate.
1. use different encryption passwords among different devices.

You shall also note that if you connect an encrypted FoxAuth database to any sync service, **ALL OTHER** unecrypted FoxAuth databases on this service will be override.

## Revisioning

Here is how this project gets revisioning:

- a - major changes, represents a complete overhaul of the code in the file, hardly distinguishable from before; you probably will never need to bump this; when creating new files just give it a version of 1.0.0. 

- b - mid-level changes, when you add or modify a significant chunk of code that alters the way the rest works; for instance when adding whole new features.

- c - minor changes, such as most bugfixes; this is probably what you will be bumping most often.

## Security

We use encryption code from [Firefox Send](github.com/mozilla/send) in WebCrypto API. Welcome as we are to any security review, it shall be more efficiently to perform it at that side.

## Third-party Branding

<a href="https://www.appinn.com/foxauth/"><img src="https://img3.appinn.com/images/appinn-small.png" alt="appinn" width="96px"></a> <a href="https://www.landiannews.com/archives/52496.html"><img src="https://static.lancdn.com/landian/public/images/logo_388.png" alt="landiannews" width="96px"></a>

## License

FoxAuth is licensed under __GNU General Public License 3.0__

```plain
Auth Plus is a Firefox (for Desktop / Android) authenticator that can autofill TOTP codes
Copyright (C) 2019 FoxAuth contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
