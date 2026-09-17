#!/usr/bin/env python3
import re
from pathlib import Path

repo_root = Path(__file__).resolve().parent.parent
coordinator_html = (repo_root / 'coordinator.html').read_text()
session_js = (repo_root / 'js/session.js').read_text()

has_epic_alert_text = bool(re.search(r'Epic.*re[- ]?entry|re[- ]?entry.*Epic|ED re[- ]?entry', coordinator_html, re.I))
has_reentry_state = bool(re.search(r'reentryAlert|reentry.*alert|recurrence.*alert', session_js, re.I))

if not (has_epic_alert_text and has_reentry_state):
    raise SystemExit(
        'Re-entry alert requirement is not yet implemented.\n'
        f'Epic alert text present: {has_epic_alert_text}\n'
        f'Reentry state present: {has_reentry_state}'
    )

print('Re-entry alert regression check passed.')
