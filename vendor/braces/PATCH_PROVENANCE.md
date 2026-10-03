# Locally maintained braces security patch

Base: npm `braces@3.0.3`, upstream https://github.com/micromatch/braces; registry tarball SHA-1 `490332f40919452272d55a8480adc0c441358789`. The original MIT license is retained. This is not an official upstream release.

Guard reference: https://github.com/blendproperty/stor24-portal/tree/18e48da5e355bad4605cb3196cc4654251545db3/vendor/braces and its `PATCH_PROVENANCE.md`. That reference credits https://github.com/FSDevelop/braces/commit/d0d575e55e74a4e0218e5248fafb79efc3e54ebb and https://github.com/micromatch/braces/pull/72.

For GHSA-vfj7-8cjw-p6xm / CVE-2026-93687, this adoption adds only the combined brace/parenthesis parser nesting ceiling and compile/expand/stringify AST depth guards, capped at 100 with tighter finite caller limits preserved. It retains original 3.0.3 quote handling and range/invalid-node semantics: unrelated parser changes from the reference are deliberately omitted. Local additional guards bound expand's two parent-chain traversals, including malformed cyclic ancestry.

The local version `3.0.4-blend-security.1` identifies these actual source changes. Package development scripts/dependencies were omitted; runtime dependencies and public API remain. The root override must resolve the real micromatch/fast-glob caller to this directory. Passing audit alone is not remediation evidence: security and ordinary-pattern tests, lint, typecheck and build gates must pass.

Replace the local override only after an official reviewed release closes this advisory and passes the same regression tests. No audit threshold or security check is suppressed.
