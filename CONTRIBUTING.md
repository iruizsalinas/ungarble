# Contributing

Thanks for your interest in contributing to ungarble.

## Bugs and issues

If you find garbled text that ungarble handles incorrectly, please open an issue with:

- The input string (copy-paste the actual text, not a screenshot)
- What you expected
- What you got

Encoding bugs are tricky to reproduce without the exact bytes, so the raw text matters.

## Pull requests

Before sending a PR, please open an issue first to discuss the change. This saves everyone time if the approach needs adjusting.

For code changes:

- `npm test` must pass
- `npm run typecheck` must pass
- Add a test for whatever you're fixing
- Keep the "do no harm" tests green -- valid text should never be corrupted

## Running locally

```sh
npm install
npm test
npm run build
```

## Questions

If you're not sure whether something is a bug or expected behavior, open an issue anyway. We'd rather hear about it than not.
