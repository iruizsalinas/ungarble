# ungarble

Fix garbled text from encoding errors.

```ts
import { ungarble } from 'ungarble'

ungarble("JosÃ©")        // -> "José"
ungarble("Ã perturber")  // -> "à perturber"
ungarble("Ä°stanbul")    // -> "İstanbul"
ungarble("already fine")  // -> "already fine" (unchanged)
```

## Installation

```sh
npm install ungarble
```

## What it does

When text is read with the wrong character encoding, you get mojibake. Characters like `é` turn into `Ã©`, and `'` turns into `â€™`. This happens constantly in data pipelines, web scraping, databases, and file imports.

**ungarble** detects which encoding error occurred and reverses it:

- Detects the specific encoding pair (UTF-8 misread as Latin-1, Windows-1252, ISO-8859-2, MacRoman, CP437, and more)
- Handles double and triple encoding (text garbled multiple times)
- Fixes mixed-encoding strings (mojibake embedded in otherwise clean text)
- Never corrupts valid text. If unsure, leaves input unchanged

## API

### `ungarble(text, options?)`

The main function. Takes garbled text, returns fixed text. Safe to call on any string, valid text passes through unchanged.

```ts
ungarble("cafÃ©")  // -> "café"
ungarble("The Mona Lisa doesnÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢t have eyebrows.")
  // -> "The Mona Lisa doesn't have eyebrows." (triple encoding fixed)
```

### `ungarble.detect(text)` / `ungarble.score(text)`

Check whether text contains mojibake.

```ts
ungarble.detect("cafÃ©")  // -> true
ungarble.detect("café")    // -> false
ungarble.score("cafÃ©")   // -> 1 (number of suspicious sequences)
```

### `ungarble.explain(text, options?)`

Returns the fixed text along with an explanation of what was done.

```ts
const result = ungarble.explain("cafÃ©")
// result.text === "café"
// result.steps === [
//   { action: "encode", detail: "latin-1" },
//   { action: "decode", detail: "utf-8" }
// ]
```

### Individual fixers

Each fix is also available on its own:

```ts
ungarble.encoding(text)    // encoding errors only, no other cleanup
ungarble.html(text)        // decode HTML entities
ungarble.quotes(text)      // curly quotes -> straight
ungarble.ligatures(text)   // ﬁ -> fi
ungarble.width(text)       // fullwidth -> normal
ungarble.lines(text)       // normalize line breaks
ungarble.surrogates(text)  // fix surrogate pairs
ungarble.escapes(text)     // strip ANSI escapes
ungarble.controls(text)    // remove control chars
ungarble.c1(text)          // C1 -> Windows-1252
```

### Options

Toggle individual fixes when calling `ungarble()` or `ungarble.explain()`:

```ts
ungarble(text, { encoding: false })  // skip encoding fix
ungarble(text, { quotes: true })     // also uncurl quotes (off by default)
```

| Option | Type | Default | Description |
|---|---|---|---|
| `encoding` | `boolean` | `true` | Detect and fix encoding errors |
| `html` | `boolean \| "auto"` | `"auto"` | Decode HTML entities. Auto disables when `<` is present |
| `lines` | `boolean` | `true` | Normalize line breaks to `\n` |
| `controls` | `boolean` | `true` | Remove zero-width and control characters |
| `escapes` | `boolean` | `true` | Strip ANSI terminal escape sequences |
| `surrogates` | `boolean` | `true` | Fix unpaired UTF-16 surrogates |
| `c1` | `boolean` | `true` | Convert C1 control chars to Windows-1252 equivalents |
| `quotes` | `boolean` | `false` | Convert curly quotes to straight quotes |
| `ligatures` | `boolean` | `false` | Expand ligatures (ﬁ -> fi) |
| `width` | `boolean` | `false` | Normalize fullwidth characters |
| `normalization` | `"NFC" \| "NFD" \| "NFKC" \| "NFKD" \| false` | `"NFC"` | Unicode normalization form |

## Supported encodings

| Original encoding | Misread as | Example |
|---|---|---|
| UTF-8 | Latin-1 / Windows-1252 | `cafÃ©` -> `café` |
| UTF-8 | Windows-1251 (Cyrillic) | `вЂ"` -> `–` |
| UTF-8 | Windows-1250 (Central European) | `ÄŒeÅ¡tina` -> `Čeština` |
| UTF-8 | Windows-1253 (Greek) | `Ελληνικά` encoding fixes |
| UTF-8 | Windows-1254 (Turkish) | `Ä°stanbul` -> `İstanbul` |
| UTF-8 | Windows-1257 (Baltic) | Latvian/Lithuanian fixes |
| UTF-8 | ISO-8859-2 | Central European text |
| UTF-8 | MacRoman | `wei√ü` -> `weiß` |
| UTF-8 | CP437 | `╨┐╤Ç╨░╨▓` -> `прав` |
| CESU-8 | Latin-1 | Emoji surrogate pair fixes |

## Credits

Inspired by [ftfy](https://github.com/rspeer/python-ftfy) by Robyn Speer. The algorithm, heuristics, and test cases are based on ftfy's approach to mojibake detection and repair. All credit for the original research and design goes to the ftfy project.
