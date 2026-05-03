## What pattern does this add?

<!-- One sentence describing the transform. Example: "Renames useContractRead → useReadContract in import specifiers and call sites." -->

## Library

- [ ] wagmi
- [ ] ethers
- [ ] @rainbow-me/rainbowkit

## Test fixture included

- [ ] Yes — `tests/<library>/input.tsx` and `tests/<library>/expected.tsx` updated
- [ ] No — explain why:

## False positive check performed

- [ ] Yes — I ran the codemod against at least one real-world repo and confirmed no unintended changes
- [ ] No — explain why:

## Checklist

- [ ] Pattern added to `scripts/codemod.ts`
- [ ] Separator tokens filtered from `getMultipleMatches` results (`.filter(n => n.text().trim() !== ',')`)
- [ ] `codemod jssg test -l tsx ./scripts/codemod.ts` passes locally
- [ ] SKILL.md updated if this pattern has edge cases that need AI cleanup
- [ ] README.md "What Gets Automated" section updated

## Related issue

<!-- Closes #<issue number> -->
