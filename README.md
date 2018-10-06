# FoxAuth Firefox TOTP Extension

<div align='center'>
  <img width='20%' height='20%' src='foxauth.svg'></img>
  <p>
  <strong>A Firefox authenticator that can autofill TOTP codes with Firefox Android support</strong>
  <br>
  <br>
    <a href='https://addons.mozilla.org/firefox/addon/foxauth/'>
      <img src='https://img.shields.io/amo/v/foxauth.svg?style=flat-square' alt='download' />
    </a>
  ·
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
</div>

## Introduction

FoxAuth is an [TOTP](https://wikipedia.org/wiki/Time-based_One-time_Password_algorithm) browser client with autofill support for __FireFox__ and __FireFox Android__ (_FireFox 57.0+ is required_)

> 2FA made no longer annoying but enjoyable

## Features

- __Firefox Android__ support
- QR code / manually add account info
- __Container tab__ support to autofill multiple same-domain accounts
- (Password based) account list (encrypted) __import / export__
- Autofill __TOTP__ form
- __Dropbox / FxA__ sync
- [Photon Design](https://design.firefox.com/photon)

## Revisioning

Here is how this project gets revisioning:

- a - major changes, represents a complete overhaul of the code in the file, hardly distinguishable from before; you probably will never need to bump this; when creating new files just give it a version of 1.0.0. 

- b - mid-level changes, when you add or modify a significant chunk of code that alters the way the rest works; for instance when adding whole new features.

- c - minor changes, such as most bugfixes; this is probably what you will be bumping most often.

## License

FoxAuth is licensed under __GNU General Public License 3.0__

```plain
FoxAuth is a Firefox(Android) authenticator that can autofill TOTP codes
Copyright (C) 2018 FoxAuth contributors

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
