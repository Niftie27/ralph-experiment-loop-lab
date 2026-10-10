# Disk usage read-only audit - 2026-10-10

Scope: read-only disk usage check. No files deleted, no services restarted, no timers changed.

Command:

```text
du -xh --max-depth=2 / 2>/tmp/du-root-permissions.err | sort -h | tail -25
journalctl --user --disk-usage
```

Output:

```text
6.0M	/etc
7.3M	/tmp/ralph_replay_hype_2026-10-09T07Z
11M	/boot/grub
11M	/tmp/loadtest_out
16M	/tmp/ralph-HYPEUSDT-verify-oJAeYp
18M	/tmp/ralph-SOLUSDT-verify-S7b5ek
29M	/tmp/node-compile-cache
30M	/usr/sbin
37M	/tmp/ralph-ETHUSDT-verify-9gflTf
40M	/tmp/ralph-ETHUSDT-verify-mhtDzT
91M	/usr/include
92M	/usr/libexec
116M	/boot
122M	/var/cache
166M	/tmp
230M	/var/lib
308M	/usr/bin
310M	/usr/share
786M	/usr/lib
1.3G	/var/log
1.6G	/usr
1.6G	/var
36G	/home
36G	/home/coder
40G	/
```

User journal usage:

```text
Archived and active journals take up 225.0M in the file system.
```

Permission-denied paths included root-owned package, private systemd, cache, log, sudo, and root directories. This was expected from a non-root read-only `du`; no privileged cleanup was attempted.
