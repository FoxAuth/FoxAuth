# FoxAuth Firefox TOTP Extension

<div align='center'>
<img width='20%' height='20%' src='foxauth.svg'></img><p>
<strong>A Firefox authenticator that can autofill TOTP codes with Firefox Android support</strong>
<br>
<br>
<a href='https://addons.mozilla.org/firefox/addon/foxauth'>
<img src='https://img.shields.io/amo/v/foxauth.svg?style=flat-square' alt='download' /></a>
·
<a href="https://travis-ci.org/FoxAuth/FoxAuth/">
<img src="https://img.shields.io/travis/FoxAuth/FoxAuth.svg?style=flat-square" alt="TravisCI" />
</a>
·
<a href="https://gitter.im//FoxAuth/FoxAuth/">
<img src="https://img.shields.io/gitter/room/FoxAuth/FoxAuth.svg?style=flat-square" alt="chatOnGitter" /></a>
·
<a href="https://github.com/FoxAuth/FoxAuth/">
<img src="https://img.shields.io/github/languages/code-size/FoxAuth/FoxAuth.svg?style=flat-square" alt="codesize" />
</a>
·
<a href="https://www.gnu.org/licenses/gpl-3.0.html">
<img src="https://img.shields.io/github/license/FoxAuth/FoxAuth.svg?style=flat-square" alt="license" />
</a>
</a>
</div>

## Introduction

FoxAuth is a [TOTP](https://wikipedia.org/wiki/Time-based_One-time_Password_algorithm) browser client with autofill support for __FireFox__ and __FireFox Android__ (_FireFox 57.0+ is required_)

## Features

- Import / Export
- Password based encryption
- Dropbox backup
- QR Code support

## Building

[Node.js](https://nodejs.org/) greater than v8.0 is required.

```bash
# Install build tools
npm install -g typescript gts

# Install development dependencies
npm install

# Fix code style issues
gts fix

# Build
npm run build
```

Windows users can also use [Msys2](http://www.msys2.org) or [CygWin](https://www.cygwin.com/) to build

## Maintainer

- [duangsuse](https://github.com/duangsuse) code helper
- [james58899](https://github.com/james58899) code helper
- [Rictusempra](https://github.com/Rictusempra) creator

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

See more at our wiki.
