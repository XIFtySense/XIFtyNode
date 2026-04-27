#!/usr/bin/env python3
"""grounded_review.py — optional grounded-review stub for loswf2.

This file resolves the (eval):7 "no such file or directory" error that
fired when grounded_review.enabled was true but the tool was absent.

CURRENT STATE: grounded_review.enabled is false in .loswf/config.yaml.
This stub exists to prevent path-resolution errors if agents check for
the file before reading config. It exits 0 and produces no output when
called directly.

To activate grounded review:
  1. Set OPENAI_API_KEY in the environment.
  2. Install pyyaml: pip install pyyaml
  3. Implement the actual OpenAI Responses API call below.
  4. Set grounded_review.enabled: true in .loswf/config.yaml.
"""
import sys


def main():
    # Stub: grounded review is disabled. Exit silently.
    # Agents should check config before calling this file.
    print("grounded_review: disabled (stub — see .loswf/config.yaml)", file=sys.stderr)
    sys.exit(0)


if __name__ == "__main__":
    main()
