# GitHub CI bootstrap receipt

Date: 18 September 2026

## Main seed

- [F] Repository: `robertfultonstudio/App-Relax`
- [F] Seed commit: `0d0fa663c25b5ef2f805ad3e1cbba0d4757dd0da`
- [F] Candidate: `MAIN-BLOCKER-FIX-C2-20260918-02`
- [F] Candidate manifest SHA-256: `c619d0bef7d7750bfc102e6e4c997cfdeb22ddbf289fb9c0b029742b74b81df6`
- [F] Candidate source tree SHA-256: `329cf89d520d27a6f486265f59132f30b20aa7e8b2805733fceea79736b78347`
- [F] Candidate delta SHA-256: `72fca854dbd283f43d864b062e1ae7a66bec12b2b4eca32ace23e2c63f995013`
- [F] Verification result: C4, A-T, and A-P passed on the same frozen candidate.

The remote repository had no `HEAD` or `main` reference before this seed. The
verified candidate was therefore pushed as the initial `main` commit so that a
non-empty pull request could establish the normal review path.

## Workflow identity

| Workflow                                | SHA-256                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| `.github/workflows/ci.yml`              | `ae869cbae355e168cef0e36097af0691aad8eed8ac74a1fe30a18c7d017b3ad3` |
| `.github/workflows/pr-policy.yml`       | `554432abdb9381b93f800e7fcd1afbf41e9c327dc88fe78097c8d86d797e6125` |
| `.github/workflows/prepare-release.yml` | `13633aa9c926eabc6eab72f49f2d4852be47e4edffaded8404264b3be73cd56f` |
| `.github/workflows/release.yml`         | `b7bc909f3f48bd4a9d7b922249697bcf1594e034ad83e1bbb3fee206d6b6947b` |

## Required pull request controls

The required status contexts for `main` are:

- `PR policy / Policy gate`
- `CI / Required gate`

These contexts must first appear on this pull request's head commit. Branch
protection or a repository ruleset may then bind the exact observed context
names. A missing or renamed context is a blocking condition.

## Scope and stop conditions

This pull request records the bootstrap, exercises the remote checks, and makes
the EAS configuration and archive gates credential-free. It does not authorize
or perform a merge, tag, release, deploy, EAS build, store submission, secret
change, or environment deployment. Those actions remain separate gates.
