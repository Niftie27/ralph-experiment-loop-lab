# VPS inventory 2026-10-28 (read-only)

Wed Oct 28 19:47:54 UTC 2026

| Kind | Name | Schedule | Last run and status | Purpose | Who reads the output |
|---|---|---|---|---|---|
| automation / tested | liquid-crypto-alert-edge-backtest | enabled: 0 */4 * * * UTC | 2026-10-28T16:03:09.057Z / ok | Legacy alert-edge, replay and report refresh | autoresearch/adversarial/report pipeline; human use not verified |
| automation / tested | ralph-autoresearch-loop | enabled: 30 9 * * * Europe/Prague | 2026-10-28T08:30:00.028Z / ok | Legacy microresearch/accounting diagnostics | next autoresearch run via router; current F1 consumer not verified |
| automation / tested | ralph-adversarial-improvement-loop | enabled: 30 19 * * * Europe/Prague | 2026-10-28T18:30:00.030Z / ok | Proposal-only critic of existing research outputs | self notification gate, maintenance freshness check |
| automation / tested | ralph-weekly-maintenance | enabled: 0 18 * * 0 Europe/Prague | 2026-10-25T17:00:00.016Z / error | Routing/service/scheduler health | operator when attention gate fires; delivery not verified |
| automation / tested | skill-collection-review-main | disabled: 604800.0 seconds | no retained last run / not verified | Skill review | disabled |
| automation / tested | crypto-updates-daily-digest-beta | disabled: 0 8 * * * Europe/Prague | 2026-08-11T06:00:00.010Z / ok | Daily market digest | disabled |
| automation / tested | RALPH ETH SOL Replay | disabled: 2026-10-09T07:12:00.000Z | 2026-10-09T07:18:53.091Z / error | Legacy one-shot replay | disabled |
| automation / tested | crypto-updates-urgent-watcher-beta | disabled: 900.0 seconds | 2026-08-25T05:54:41.896Z / ok | Legacy urgent watcher | disabled |
| automation / tested | bybit-execution-reactor | disabled: 60.0 seconds | 2026-08-11T14:18:55.787Z / ok | Legacy reactor automation; process now separate | disabled duplicate |
| automation / tested | ralph-state-of-edge-daily | disabled: 15 19 * * * Europe/Prague | 2026-10-18T07:34:10.114Z / ok | Standalone edge report | disabled; report also produced by alert-edge |
| automation / tested | heartbeat-main | disabled: 1800.0 seconds | 2026-10-16T12:36:09.026Z / skipped | Proactive heartbeat | disabled |
| user service / tested | bybit-execution-reactor.service | continuous/event/boot; no calendar schedule | Thu 2026-10-15 22:39:58 UTC / active running | taken over unit: Bybit read-only execution reactor for Tomas | private execution/research pipeline |
| user service / tested | crypto-updates-market-watcher.service | continuous/event/boot; no calendar schedule | Thu 2026-10-15 22:39:58 UTC / active running | taken over unit: Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher | alert/research pipeline |
| user service / tested | dbus.service | continuous/event/boot; no calendar schedule | Thu 2026-08-20 21:29:12 UTC / active running | taken over unit: D-Bus User Message Bus | OS/subsystem; human readership not verified |
| user service / tested | gpg-agent.service | continuous/event/boot; no calendar schedule | Sun 2026-10-04 08:45:15 UTC / active running | taken over unit: GnuPG cryptographic agent and passphrase cache | OS/subsystem; human readership not verified |
| user service / tested | openclaw-gateway.service | continuous/event/boot; no calendar schedule | Wed 2026-10-21 08:35:14 UTC / active running | taken over unit: OpenClaw Gateway | operator, agents and automation runtime |
| user service / tested | openclaw-node.service | continuous/event/boot; no calendar schedule | Fri 2026-10-16 12:18:21 UTC / active running | taken over unit: OpenClaw Node Host (v2026.6.6) | node tool clients |
| user service / tested | ralph-collector-dashboard.service | continuous/event/boot; no calendar schedule | Thu 2026-10-08 21:09:19 UTC / active running | taken over unit: RALPH orderflow dashboard (localhost only) | operator UI; actual readership not verified |
| user service / tested | ralph-collector-ethusdt.service | continuous/event/boot; no calendar schedule | Fri 2026-10-09 14:09:01 UTC / active running | taken over unit: Binance ETHUSDT orderflow collector for RALPH (read-only market data) | archive/research |
| user service / tested | ralph-collector-hypeusdt.service | continuous/event/boot; no calendar schedule | Fri 2026-10-09 14:09:01 UTC / active running | taken over unit: Binance HYPEUSDT orderflow collector for RALPH (read-only market data) | archive/research |
| user service / tested | ralph-collector-solusdt.service | continuous/event/boot; no calendar schedule | Fri 2026-10-09 14:09:01 UTC / active running | taken over unit: Binance SOLUSDT orderflow collector for RALPH (read-only market data) | archive/research |
| user service / tested | ralph-collector.service | continuous/event/boot; no calendar schedule | Fri 2026-10-09 14:09:02 UTC / active running | taken over unit: Binance BTCUSDT orderflow collector for RALPH (read-only market data) | dashboard/archive/research; actual F1 use not verified |
| user service / tested | ralph-w1-archive.service | continuous/event/boot; no calendar schedule | Mon 2026-10-19 06:53:23 UTC / failed failed | taken over unit: /usr/bin/python3 -u ~/ralph-experiment-loop-lab/tools/maintenance/research_archive.py --manifest ~/ralph-state/w1/w1-2026-10-19.csv --report ~/ralph-state/w1/report.json --delete-after-r4 | OS/subsystem; human readership not verified |
| user timer / tested | launchpadlib-cache-clean.timer | enabled; { OnUnitActiveUSec=1d }; { OnStartupUSec=5min }; AccuracyUSec=1min; RandomizedDelayUSec=0 | Wed 2026-10-28 18:04:20 UTC / active; latest service Result=success | taken over unit: Clean up old files in the Launchpadlib cache | launchpad library cache |
| user timer / tested | ralph-archive-upload.timer | enabled; { OnCalendar=*-*-* *:40:00 }; AccuracyUSec=5min; RandomizedDelayUSec=0 | Wed 2026-10-28 19:44:17 UTC / active; latest service Result=success | taken over unit: Run RALPH collector archive upload hourly | archive/restore workflows |
| user timer / tested | ralph-data-checks.timer | enabled; { OnCalendar=*-*-* 00:20:00 UTC }; AccuracyUSec=1min; RandomizedDelayUSec=0 | Wed 2026-10-28 00:20:17 UTC / active; latest service Result=success | taken over unit: Run RALPH hourly data checks daily | data-checks repo/operator; delivery not verified |
| user timer / tested | ralph-disk-alert.timer | enabled; { OnCalendar=*-*-* *:00:00 }; AccuracyUSec=5min; RandomizedDelayUSec=0 | Wed 2026-10-28 19:04:17 UTC / active; latest service Result=success | taken over unit: Check RALPH disk free space hourly | operator attention gate; receipt not verified |
| user timer / tested | ralph-storage-maintenance.timer | enabled; { OnCalendar=*-*-* *:00:00 }; AccuracyUSec=5min; RandomizedDelayUSec=0 | Wed 2026-10-28 19:04:17 UTC / active; latest service Result=success | taken over unit: Run RALPH collector storage maintenance hourly | collector storage/archive readers |
| user timer / tested | systemd-tmpfiles-clean.timer | disabled; { OnUnitActiveUSec=1d }; { OnStartupUSec=5min }; AccuracyUSec=1min; RandomizedDelayUSec=0 | no last trigger recorded / inactive; latest service Result=success | taken over unit: Daily Cleanup of User's Temporary Directories | OS temporary-file lifecycle |
| user socket / tested | dbus.socket | event activated | active running; last request not verified | taken over unit: D-Bus User Message Bus Socket | OS/service clients; request history not verified |
| user socket / tested | dirmngr.socket | event activated | active listening; last request not verified | taken over unit: GnuPG network certificate management daemon | OS/service clients; request history not verified |
| user socket / tested | gpg-agent-browser.socket | event activated | active running; last request not verified | taken over unit: GnuPG cryptographic agent and passphrase cache (access for web browsers) | OS/service clients; request history not verified |
| user socket / tested | gpg-agent-extra.socket | event activated | active running; last request not verified | taken over unit: GnuPG cryptographic agent and passphrase cache (restricted) | OS/service clients; request history not verified |
| user socket / tested | gpg-agent-ssh.socket | event activated | active running; last request not verified | taken over unit: GnuPG cryptographic agent (ssh-agent emulation) | OS/service clients; request history not verified |
| user socket / tested | gpg-agent.socket | event activated | active running; last request not verified | taken over unit: GnuPG cryptographic agent and passphrase cache | OS/service clients; request history not verified |
| user socket / tested | keyboxd.socket | event activated | active listening; last request not verified | taken over unit: GnuPG public key management service | OS/service clients; request history not verified |
| user socket / tested | pk-debconf-helper.socket | event activated | active listening; last request not verified | taken over unit: debconf communication socket | OS/service clients; request history not verified |
| user socket / tested | snapd.session-agent.socket | event activated | active listening; last request not verified | taken over unit: REST API socket for snapd user session agent | OS/service clients; request history not verified |
| system service / tested | apparmor.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Load AppArmor profiles | OS/subsystem; human readership not verified |
| system service / tested | apport.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: automatic crash report generation | OS/subsystem; human readership not verified |
| system service / tested | atd.service | continuous/event/boot; no calendar schedule | Sat 2026-09-12 06:26:11 UTC / active running | taken over unit: Deferred execution scheduler | OS/subsystem; human readership not verified |
| system service / tested | blk-availability.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: Availability of block devices | OS/subsystem; human readership not verified |
| system service / tested | cloud-config.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: Cloud-init: Config Stage | OS/subsystem; human readership not verified |
| system service / tested | cloud-final.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:26 UTC / active exited | taken over unit: Cloud-init: Final Stage | OS/subsystem; human readership not verified |
| system service / tested | cloud-init-local.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:23 UTC / active exited | taken over unit: Cloud-init: Local Stage (pre-network) | OS/subsystem; human readership not verified |
| system service / tested | cloud-init.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: Cloud-init: Network Stage | OS/subsystem; human readership not verified |
| system service / tested | console-setup.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Set console font and keymap | OS/subsystem; human readership not verified |
| system service / tested | cron.service | continuous/event/boot; no calendar schedule | Thu 2026-10-15 22:38:13 UTC / active running | taken over unit: Regular background program processing daemon | OS/subsystem; human readership not verified |
| system service / tested | dbus.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active running | taken over unit: D-Bus System Message Bus | OS/subsystem; human readership not verified |
| system service / tested | finalrd.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Create final runtime dir for shutdown pivot root | OS/subsystem; human readership not verified |
| system service / tested | getty@tty1.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active running | taken over unit: Getty on tty1 | OS/subsystem; human readership not verified |
| system service / tested | keyboard-setup.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Set the console keyboard layout | OS/subsystem; human readership not verified |
| system service / tested | kmod-static-nodes.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Create List of Static Device Nodes | OS/subsystem; human readership not verified |
| system service / tested | lvm2-monitor.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Monitoring of LVM2 mirrors, snapshots etc. using dmeventd or progress polling | OS/subsystem; human readership not verified |
| system service / tested | multipathd.service | continuous/event/boot; no calendar schedule | Thu 2026-10-22 06:41:43 UTC / active running | taken over unit: Device-Mapper Multipath Device Controller | OS/subsystem; human readership not verified |
| system service / tested | plymouth-quit-wait.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: Hold until boot process finishes up | OS/subsystem; human readership not verified |
| system service / tested | plymouth-quit.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: Terminate Plymouth Boot Screen | OS/subsystem; human readership not verified |
| system service / tested | plymouth-read-write.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Tell Plymouth To Write Out Runtime Data | OS/subsystem; human readership not verified |
| system service / tested | polkit.service | continuous/event/boot; no calendar schedule | Sun 2026-10-25 06:41:39 UTC / active running | taken over unit: Authorization Manager | OS/subsystem; human readership not verified |
| system service / tested | qemu-guest-agent.service | continuous/event/boot; no calendar schedule | Fri 2026-10-16 06:03:27 UTC / active running | taken over unit: QEMU Guest Agent | OS/subsystem; human readership not verified |
| system service / tested | rsyslog.service | continuous/event/boot; no calendar schedule | Sun 2026-10-25 06:41:39 UTC / active running | taken over unit: System Logging Service | OS/subsystem; human readership not verified |
| system service / tested | serial-getty@ttyS0.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active running | taken over unit: Serial Getty on ttyS0 | OS/subsystem; human readership not verified |
| system service / tested | setvtrgb.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: Set console scheme | OS/subsystem; human readership not verified |
| system service / tested | snapd.apparmor.service | continuous/event/boot; no calendar schedule | Fri 2026-07-24 06:42:23 UTC / active exited | taken over unit: Load AppArmor profiles managed internally by snapd | OS/subsystem; human readership not verified |
| system service / tested | snapd.seeded.service | continuous/event/boot; no calendar schedule | Fri 2026-07-24 06:42:23 UTC / active exited | taken over unit: Wait until snapd is fully seeded | OS/subsystem; human readership not verified |
| system service / tested | ssh.service | continuous/event/boot; no calendar schedule | Sun 2026-10-25 06:41:39 UTC / active running | taken over unit: OpenBSD Secure Shell server | OS/subsystem; human readership not verified |
| system service / tested | sysstat.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: Resets System Activity Logs | OS/subsystem; human readership not verified |
| system service / tested | systemd-binfmt.service | continuous/event/boot; no calendar schedule | Sat 2026-09-12 06:26:02 UTC / active exited | taken over unit: Set Up Additional Binary Formats | OS/subsystem; human readership not verified |
| system service / tested | systemd-fsck@<device>.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Filesystem check for boot device | OS/subsystem; human readership not verified |
| system service / tested | systemd-journal-flush.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Flush Journal to Persistent Storage | OS/subsystem; human readership not verified |
| system service / tested | systemd-journald.service | continuous/event/boot; no calendar schedule | Thu 2026-10-22 06:41:43 UTC / active running | taken over unit: Journal Service | OS/subsystem; human readership not verified |
| system service / tested | systemd-logind.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active running | taken over unit: User Login Management | OS/subsystem; human readership not verified |
| system service / tested | systemd-modules-load.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Load Kernel Modules | OS/subsystem; human readership not verified |
| system service / tested | systemd-networkd-wait-online.service | continuous/event/boot; no calendar schedule | Thu 2026-10-22 06:41:43 UTC / active exited | taken over unit: Wait for Network to be Configured | OS/subsystem; human readership not verified |
| system service / tested | systemd-networkd.service | continuous/event/boot; no calendar schedule | Thu 2026-10-22 06:41:43 UTC / active running | taken over unit: Network Configuration | OS/subsystem; human readership not verified |
| system service / tested | systemd-random-seed.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Load/Save OS Random Seed | OS/subsystem; human readership not verified |
| system service / tested | systemd-remount-fs.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Remount Root and Kernel File Systems | OS/subsystem; human readership not verified |
| system service / tested | systemd-resolved.service | continuous/event/boot; no calendar schedule | Thu 2026-10-22 06:41:43 UTC / active running | taken over unit: Network Name Resolution | OS/subsystem; human readership not verified |
| system service / tested | systemd-sysctl.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Apply Kernel Variables | OS/subsystem; human readership not verified |
| system service / tested | systemd-timesyncd.service | continuous/event/boot; no calendar schedule | Thu 2026-10-22 06:41:43 UTC / active running | taken over unit: Network Time Synchronization | OS/subsystem; human readership not verified |
| system service / tested | systemd-tmpfiles-setup-dev-early.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Create Static Device Nodes in /dev gracefully | OS/subsystem; human readership not verified |
| system service / tested | systemd-tmpfiles-setup-dev.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Create Static Device Nodes in /dev | OS/subsystem; human readership not verified |
| system service / tested | systemd-tmpfiles-setup.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Create Volatile Files and Directories | OS/subsystem; human readership not verified |
| system service / tested | systemd-udev-trigger.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Coldplug All udev Devices | OS/subsystem; human readership not verified |
| system service / tested | systemd-udevd.service | continuous/event/boot; no calendar schedule | Thu 2026-10-22 06:41:43 UTC / active running | taken over unit: Rule-based Manager for Device Events and Files | OS/subsystem; human readership not verified |
| system service / tested | systemd-update-utmp.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Record System Boot/Shutdown in UTMP | OS/subsystem; human readership not verified |
| system service / tested | systemd-user-sessions.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: Permit User Sessions | OS/subsystem; human readership not verified |
| system service / tested | ufw.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:21 UTC / active exited | taken over unit: Uncomplicated firewall | OS/subsystem; human readership not verified |
| system service / tested | unattended-upgrades.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active running | taken over unit: Unattended Upgrades Shutdown | OS/subsystem; human readership not verified |
| system service / tested | user-runtime-dir@0.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 16:00:14 UTC / active exited | taken over unit: User Runtime Directory /run/user/0 | OS/subsystem; human readership not verified |
| system service / tested | user-runtime-dir@1000.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active exited | taken over unit: User Runtime Directory /run/user/1000 | OS/subsystem; human readership not verified |
| system service / tested | user@0.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 16:00:14 UTC / active running | taken over unit: User Manager for UID 0 | OS/subsystem; human readership not verified |
| system service / tested | user@1000.service | continuous/event/boot; no calendar schedule | Sat 2026-06-13 15:58:25 UTC / active running | taken over unit: User Manager for UID 1000 | OS/subsystem; human readership not verified |
| system timer / tested | apport-autoreport.timer | enabled; { OnUnitActiveUSec=3h }; { OnStartupUSec=1h }; AccuracyUSec=1min; RandomizedDelayUSec=0 | no last trigger recorded / inactive; latest service Result=success | taken over unit: Process error reports when automatic reporting is enabled (timer based) | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | apt-daily-upgrade.timer | enabled; { OnCalendar=*-*-* 06:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=1h | Wed 2026-10-28 06:20:13 UTC / active; latest service Result=success | taken over unit: Daily apt upgrade and clean activities | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | apt-daily.timer | enabled; { OnCalendar=*-*-* 06,18:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=12h | Wed 2026-10-28 18:45:52 UTC / active; latest service Result=success | taken over unit: Daily apt download activities | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | dpkg-db-backup.timer | enabled; { OnCalendar=*-*-* 00:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=0 | Wed 2026-10-28 00:00:01 UTC / active; latest service Result=success | taken over unit: Daily dpkg database backup timer | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | e2scrub_all.timer | enabled; { OnCalendar=Sun *-*-* 03:10:00 }; AccuracyUSec=1min; RandomizedDelayUSec=1min | Sun 2026-10-25 03:10:47 UTC / active; latest service Result=success | taken over unit: Periodic ext4 Online Metadata Check for All Filesystems | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | fstrim.timer | enabled; { OnCalendar=Mon *-*-* 00:00:00 }; AccuracyUSec=1h; RandomizedDelayUSec=1h 40min | Mon 2026-10-26 00:42:35 UTC / active; latest service Result=success | taken over unit: Discard unused filesystem blocks once a week | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | logrotate.timer | enabled; { OnCalendar=*-*-* 00:00:00 }; AccuracyUSec=1h; RandomizedDelayUSec=0 | Wed 2026-10-28 00:00:01 UTC / active; latest service Result=success | taken over unit: Daily rotation of log files | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | man-db.timer | enabled; { OnCalendar=*-*-* 00:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=12h | Wed 2026-10-28 01:15:15 UTC / active; latest service Result=success | taken over unit: Daily man-db regeneration | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | mdadm-last-resort@.timer | static; 30 seconds after activation | no last trigger recorded / not verified; latest service Result=not verified | taken over unit: mdadm-last-resort@.timer | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | mdcheck_continue.timer | enabled; { OnCalendar=*-*-* 00:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=12h | no last trigger recorded / inactive; latest service Result=success | taken over unit: MD array scrubbing - continuation | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | mdcheck_start.timer | enabled; { OnCalendar=Sun *-*-01..07 01:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=1d | no last trigger recorded / inactive; latest service Result=success | taken over unit: MD array scrubbing | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | mdmonitor-oneshot.timer | enabled; { OnCalendar=*-*-* 00:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=1d | no last trigger recorded / inactive; latest service Result=success | taken over unit: Reminder for degraded MD arrays | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | motd-news.timer | enabled; { OnStartupUSec=1min }; { OnCalendar=*-*-* 00,12:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=12h | Wed 2026-10-28 19:08:10 UTC / active; latest service Result=success | taken over unit: Message of the Day | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | snapd.snap-repair.timer | enabled; { OnStartupUSec=15min }; { OnCalendar=*-*-* 05,11,17,23:00:00 }; AccuracyUSec=10min; RandomizedDelayUSec=2h | no last trigger recorded / inactive; latest service Result=success | taken over unit: Timer to automatically fetch and run repair assertions | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | sysstat-collect.timer | enabled; { OnCalendar=*-*-* *:00/10:00 }; AccuracyUSec=1min; RandomizedDelayUSec=0 | Wed 2026-10-28 19:50:01 UTC / active; latest service Result=success | taken over unit: Run system activity accounting tool every 10 minutes | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | sysstat-summary.timer | enabled; { OnCalendar=*-*-* 00:07:00 }; AccuracyUSec=1min; RandomizedDelayUSec=0 | Wed 2026-10-28 00:07:00 UTC / active; latest service Result=success | taken over unit: Generate summary of yesterday's process accounting | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | systemd-sysupdate-reboot.timer | disabled; { OnCalendar=*-*-* 04:10:00 }; AccuracyUSec=1min; RandomizedDelayUSec=30min | no last trigger recorded / inactive; latest service Result=success | taken over unit: Reboot Automatically After System Update | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | systemd-sysupdate.timer | disabled; { OnUnitActiveUSec=2h }; { OnBootUSec=15min }; { OnCalendar=Sat *-*-* 00:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=4h | no last trigger recorded / inactive; latest service Result=success | taken over unit: Automatic System Update | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | systemd-tmpfiles-clean.timer | static; { OnUnitActiveUSec=1d }; { OnBootUSec=15min }; AccuracyUSec=1min; RandomizedDelayUSec=0 | Wed 2026-10-28 16:40:16 UTC / active; latest service Result=success | taken over unit: Daily Cleanup of Temporary Directories | OS temporary-file lifecycle |
| system timer / tested | ua-timer.timer | enabled; { OnStartupUSec=1min }; { OnUnitActiveUSec=6h }; AccuracyUSec=1min; RandomizedDelayUSec=1h | no last trigger recorded / inactive; latest service Result=success | taken over unit: Ubuntu Pro Timer for running repeated jobs | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | update-notifier-download.timer | enabled; { OnUnitActiveUSec=1d }; { OnStartupUSec=5min }; AccuracyUSec=1min; RandomizedDelayUSec=0 | Wed 2026-10-28 16:25:30 UTC / active; latest service Result=success | taken over unit: Download data for packages that failed at package install time | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | update-notifier-motd.timer | enabled; { OnCalendar=Sun *-*-* 06:00:00 }; AccuracyUSec=1min; RandomizedDelayUSec=1w | Tue 2026-10-20 16:29:39 UTC / active; latest service Result=success | taken over unit: Check to see whether there is a new version of Ubuntu available | OS maintenance/diagnostics; human readership not verified |
| system timer / tested | xfs_scrub_all.timer | disabled; { OnCalendar=Sun *-*-* 03:10:00 }; AccuracyUSec=1min; RandomizedDelayUSec=1min | no last trigger recorded / inactive; latest service Result=success | taken over unit: Periodic XFS Online Metadata Check for All Filesystems | OS maintenance/diagnostics; human readership not verified |
| system socket / tested | acpid.socket | event activated | active listening; last request not verified | taken over unit: ACPID Listen Socket | OS/service clients; request history not verified |
| system socket / tested | apport-forward.socket | event activated | inactive dead; last request not verified | taken over unit: Unix socket for apport crash forwarding | OS/service clients; request history not verified |
| system socket / tested | cloud-init-hotplugd.socket | event activated | active listening; last request not verified | taken over unit: cloud-init hotplug hook socket | OS/service clients; request history not verified |
| system socket / tested | dbus.socket | event activated | active running; last request not verified | taken over unit: D-Bus System Message Bus Socket | OS/service clients; request history not verified |
| system socket / tested | dm-event.socket | event activated | active listening; last request not verified | taken over unit: Device-mapper event daemon FIFOs | OS/service clients; request history not verified |
| system socket / tested | iscsid.socket | event activated | active listening; last request not verified | taken over unit: Open-iSCSI iscsid Socket | OS/service clients; request history not verified |
| system socket / tested | lvm2-lvmpolld.socket | event activated | active listening; last request not verified | taken over unit: LVM2 poll daemon socket | OS/service clients; request history not verified |
| system socket / tested | lxd-installer.socket | event activated | active listening; last request not verified | taken over unit: Helper to install lxd snap on demand | OS/service clients; request history not verified |
| system socket / tested | multipathd.socket | event activated | active running; last request not verified | taken over unit: multipathd control socket | OS/service clients; request history not verified |
| system socket / tested | snapd.socket | event activated | active listening; last request not verified | taken over unit: Socket activation for snappy daemon | OS/service clients; request history not verified |
| system socket / tested | ssh.socket | event activated | active running; last request not verified | taken over unit: OpenBSD Secure Shell server socket | OS/service clients; request history not verified |
| system socket / tested | syslog.socket | event activated | active running; last request not verified | taken over unit: Syslog Socket | OS/service clients; request history not verified |
| system socket / tested | systemd-fsckd.socket | event activated | active listening; last request not verified | taken over unit: fsck to fsckd communication Socket | OS/service clients; request history not verified |
| system socket / tested | systemd-initctl.socket | event activated | active listening; last request not verified | taken over unit: initctl Compatibility Named Pipe | OS/service clients; request history not verified |
| system socket / tested | systemd-journald-audit.socket | event activated | inactive dead; last request not verified | taken over unit: Journal Audit Socket | OS/service clients; request history not verified |
| system socket / tested | systemd-journald-dev-log.socket | event activated | active running; last request not verified | taken over unit: Journal Socket (/dev/log) | OS/service clients; request history not verified |
| system socket / tested | systemd-journald.socket | event activated | active running; last request not verified | taken over unit: Journal Socket | OS/service clients; request history not verified |
| system socket / tested | systemd-networkd.socket | event activated | active running; last request not verified | taken over unit: Network Service Netlink Socket | OS/service clients; request history not verified |
| system socket / tested | systemd-pcrextend.socket | event activated | inactive dead; last request not verified | taken over unit: TPM2 PCR Extension (Varlink) | OS/service clients; request history not verified |
| system socket / tested | systemd-rfkill.socket | event activated | active listening; last request not verified | taken over unit: Load/Save RF Kill Switch Status /dev/rfkill Watch | OS/service clients; request history not verified |
| system socket / tested | systemd-sysext.socket | event activated | active listening; last request not verified | taken over unit: System Extension Image Management (Varlink) | OS/service clients; request history not verified |
| system socket / tested | systemd-udevd-control.socket | event activated | active running; last request not verified | taken over unit: udev Control Socket | OS/service clients; request history not verified |
| system socket / tested | systemd-udevd-kernel.socket | event activated | active running; last request not verified | taken over unit: udev Kernel Socket | OS/service clients; request history not verified |
| system socket / tested | uuidd.socket | event activated | active listening; last request not verified | taken over unit: UUID daemon activation socket | OS/service clients; request history not verified |
| system path / tested | acpid.path | event activated | active waiting; last request not verified | taken over unit: ACPI Events Check | OS/service clients; request history not verified |
| system path / tested | apport-autoreport.path | event activated | inactive dead; last request not verified | taken over unit: Process error reports when automatic reporting is enabled (file watch) | OS/service clients; request history not verified |
| system path / tested | systemd-ask-password-console.path | event activated | active waiting; last request not verified | taken over unit: Dispatch Password Requests to Console Directory Watch | OS/service clients; request history not verified |
| system path / tested | systemd-ask-password-plymouth.path | event activated | inactive dead; last request not verified | taken over unit: Forward Password Requests to Plymouth Directory Watch | OS/service clients; request history not verified |
| system path / tested | systemd-ask-password-wall.path | event activated | active waiting; last request not verified | taken over unit: Forward Password Requests to Wall Directory Watch | OS/service clients; request history not verified |
| system path / tested | tpm-udev.path | event activated | inactive dead; last request not verified | taken over unit: Handle dynamically added tpm devices | OS/service clients; request history not verified |
| system path / tested | whoopsie.path | event activated | inactive dead; last request not verified | taken over unit: whoopsie.path | OS/service clients; request history not verified |
| cron/deferred / tested definition | short-watch supervisor | @reboot and every minute | 14-day execution counts not verified | Ensure existing BTC and ZEC/HYPE short watcher processes | operator alerts; read receipt not verified |
| cron/deferred / tested definition | system cron.hourly | minute 17 each hour | 14-day execution counts not verified | run-parts; directory had no executable task files | OS |
| cron/deferred / tested definition | system cron.daily | 06:25 daily when anacron absent | 14-day execution counts not verified | apport cleanup; dpkg/logrotate/man-db/sysstat/apt compatibility scripts | OS; most compatibility scripts skip on systemd |
| cron/deferred / tested definition | system cron.weekly | Sunday 06:47 when anacron absent | 14-day execution counts not verified | man-db compatibility script (systemd guard) | OS |
| cron/deferred / tested definition | system cron.monthly | day 1 at 06:52 when anacron absent | 14-day execution counts not verified | run-parts; directory had no executable task files | OS |
| cron/deferred / tested definition | cron.d/e2scrub_all | Sunday 03:30 and daily 03:10 | 14-day execution counts not verified | Filesystem scrub compatibility; systemd guard | OS |
| cron/deferred / tested definition | cron.d/sysstat | 5-55/10 each hour; 23:59 daily | 14-day execution counts not verified | Activity collection compatibility; helper skips under systemd | OS diagnostics |
| cron/deferred / tested definition | current-user at queue | one-shot queue | 14-day execution counts not verified | atq returned empty | no current item |
| unmanaged processes / tested | BTC short watcher; ZEC/HYPE short watcher | continuous; cron supervisor above | both observed in process list; last alert not verified | existing short alerts (unchanged) | operator; actual receipt not verified |
| runtime descendants / tested | Codex agents, MCP filesystem servers and npm launchers | on-demand, not separate calendar jobs | observed in process/RSS snapshot | agent work and tool services | OpenClaw agent runtime |

Table evidence: runtime states, schedules and last-trigger fields are **tested** by live tool/systemctl inspection; unit/payload purposes are **taken over** from their definitions; intended readers are source-derived or **reasoning**, not human-read receipts. “Result=success” with no last trigger does not establish an executed successful run. Calendar randomization/accuracy may shift actual firing; inactive definitions are not active schedules. Boot services marked exited are completed, not resident processes.

## Evidence and limits

**Tested — scope and method:** step 1 produced the exact required base commit; step 2 captured the live snapshot above. Investigation used read-only systemctl show/cat/list-units/list-unit-files, journalctl JSON, process RSS/command identification, filesystem metadata, SHA256 comparisons, automation list/runs, source inspection and scoped git history. No jobs, timers, watchers, configurations or trading behavior were changed or triggered. The only intended repository change is this inventory.

**Tested — coverage:** the gateway-wide list returned 11 automations, 4 enabled, with no further page. The step-2 loaded timer lists contain 5 user and 16 system timers. Installed definitions also include 1 disabled user timer and 7 additional system timer definitions; these are included above. Socket/path activation and boot-completed services are included so inactive-but-activatable services are not mistaken for missing infrastructure.

**Tested / not verified — history:** the requested 14-day window starts 2026-10-14 19:47:54 UTC and ends at the step-2 snapshot. Automation history returned only 7 autoresearch, 7 adversarial, 42 alert-edge and 1 weekly-maintenance records, with hasMore=false. The oldest returned record is October 21 for alert-edge and October 22 for the daily jobs. Legacy run-history files for autoresearch and weekly-maintenance are absent. This is incomplete historical coverage, not evidence that earlier scheduled runs did not happen. Retention duration/cause is not verified. Kernel and system-service journals are not accessible sufficiently to establish the requested historical counts; an empty query is not zero failures. A noninteractive privileged read was denied. No permissions were changed.

**Tested — publication:** delivery targets are omitted from automation summaries. Private categories below have only counts and sizes; no private filenames or contents are published. The raw automation section was truncated by the prescribed head command and is deliberately excluded; the complete list was obtained independently through the automation tool.

## T1. Collectors and runtime identity

**Tested — all 4 units:** systemctl show reports active, NRestarts=0 for each. This counter is the current systemd restart counter, not a proof of no historical interruption. Unit ExecStart identifies the data roots.

| Symbol / unit | Active since UTC | Newest market-data file at inspection | Age | Newest feature file / age |
|---|---|---|---:|---|
| BTC / ralph-collector | 2026-10-09 14:09:02 | ~/data/binance/tape_BTCUSDT_2026-10-28T19Z.csv | 0.2 s | ~/data/features/live.json / 0.6 s |
| ETH / ralph-collector-ethusdt | 2026-10-09 14:09:01 | ~/data/binance-ethusdt/raw_ETHUSDT_2026-10-28T19Z.jsonl.gz | 0.2 s | ~/data/features-ethusdt/live.json / 0.5 s |
| SOL / ralph-collector-solusdt | 2026-10-09 14:09:01 | ~/data/binance-solusdt/book_SOLUSDT_2026-10-28T19Z.jsonl.gz | 4.2 s | ~/data/features-solusdt/live.json / 0.9 s |
| HYPE / ralph-collector-hypeusdt | 2026-10-09 14:09:01 | ~/data/binance-hypeusdt/raw_HYPEUSDT_2026-10-28T19Z.jsonl.gz | 3.7 s | ~/data/features-hypeusdt/live.json / 0.8 s |

**Tested — metadata only:** recursive file counts were BTC 1,133 market-data / 86 feature files; ETH 1,164 / 108; SOL 1,164 / 108; HYPE 1,158 / 109. Fresh mtime proves recent writing, not stream completeness, timestamp correctness or absence of gaps; those are not verified by this inventory.

**Tested — SHA256 runtime versus repo:** all 15 Python files in ~/ralph_collector match their counterparts in tools/collector, including binance_live.py, symbol_settings.py, orderflow_engine.py, dashboard.py and the four maintenance scripts. binance_live.py SHA256 is 130c9a650043357535320e120c31655d13d79ba99d1d447052f7bd8197f76199. The watcher, reactor, both short-watch scripts and their supervisor also match (5/5); the two indexing scripts and service-health-check match (3/3). Both report generators and 13 scheduled alert-edge entrypoints match (15/15). Total: 38/38 compared relevant runtime/support source files match.

**Tested / not verified — boundary:** an additional, non-scheduled strategy-filter verifier differs from its repo copy; it is not the alert-edge verify command and is not evidence that a currently running entrypoint differs. No repair made. Full transitive dependency identity, installed OpenClaw/Codex binaries, OS packages and already-loaded process code versus on-disk source are not verified against this project repo; R2 is not claimed universally proven. Do not redeploy or run an unverified heavy path based on this sampled identity check.

**Reasoning — consumers:** live features serve the collector dashboard and research inspection; archived market data supports later replay and provenance. Actual human readership and actual F1 consumption of every collector stream are not verified. F1 presently uses its separately specified Binance Vision inputs (taken over: docs/MAP.md, I59), not automatically these live files.

## T2. Weekly maintenance: last three runs and scope

| Run | Evidence label / status | Short error text or limitation |
|---|---|---|
| 2026-10-25 17:00 UTC | Tested: retained scheduler record, error, 103.144 s | “Broader cron-health verification remains blocked: automation tools expose only this job. Its previous run shows one consecutive error, not a confirmed timeout.” |
| 2026-10-18 16:00 UTC | Taken over: docs/ledger.md I54; failed. Exact scheduler error and duration not verified. | Contemporary maintenance log: “Other cron health/error streaks inaccessible through current-job-only tool; no workaround or scheduler mutation.” Also noted the adversarial report was about 118.5 h stale. |
| Third most recent run | Not verified: no third retained scheduler record or exact error recovered | October 18's log says its previous run succeeded; date, duration and error text are not verified. Do not invent an October 11 failure from the weekly schedule. |

**Tested — documented access rule:** installed OpenClaw documentation, docs/automation/cron-jobs/how-it-works.md, “Isolated run hardening”, says: “Isolated runs with the narrow automation self-cleanup grant can read scheduler status, a self-filtered list containing only their own job, and that job's run history, and may remove only their own job.” Public documentation route: https://docs.openclaw.ai/automation/cron-jobs/how-it-works . This was checked in the installed documentation, not by asserting remote-page freshness.

**Reasoning — cause:** the scheduled payload asks for cross-job cron health while its isolated authority grants only self visibility. The retained October 25 error and I54 agree with that documented boundary. This is an authorization/scope mismatch, not established evidence of a timeout or missing jobs. An owner-invoked inventory seeing all 11 jobs does not grant equivalent authority to the scheduled run.

**Reasoning — proposals only:**

1. Narrow weekly maintenance to self health plus explicitly readable local service/output checks; label global scheduler health unavailable.
2. Design the I63 ops supervisor first: a separately authorized, minimal read-only inventory surface supplies sanitized cross-job status to the isolated analyst. Verify its actual access in a scheduled context before enabling it.
3. Owner/administrator review can perform the global check directly until such a surface exists. Do not bypass job isolation or broaden credentials inside the failing job.

**Tested / taken over:** latest scheduler state has two consecutive errors. The current adversarial report exists with generation time 2026-10-28 18:30:10.469Z, so October 18's stale-report observation is not a current stale-report finding.

## T3. Autoresearch: runs, outputs, effect and fit to F1

**Tested — retained run records; taken over — research summaries:** statuses/durations below come from automation runs. All 7 retained summaries are literally NO_TELEGRAM_UPDATE; substantive descriptions come from the matching dated research-log sections, not from rerunning their experiments.

| Date UTC | Status / duration | 1–3-line summary and output |
|---|---|---|
| Oct 15 | Not verified / not verified | No retained run record or attributable dated autoresearch result recovered. |
| Oct 16 | Not verified / not verified | No retained run record. A general backlog-intake entry is not proof of an autoresearch run. |
| Oct 17 | Not verified / not verified | No retained run record or attributable output recovered. |
| Oct 18 | Not verified / not verified | I45 records re-enabling and a next run on Oct 19; schedule intent is not execution evidence. |
| Oct 19 | Not verified / not verified | Expected from I45; actual run, duration and output not verified. |
| Oct 20 07:30 | Completion status not verified / duration not verified | Research log records a paper-fund drawdown audit, 488 closed rows and sensitivity to tied exits. Log/router trace; rejects treating positive terminal equity as proof of funded survival. |
| Oct 21 07:30 | Completion status not verified / duration not verified | Log records margin-feasibility audit, 495 closed rows; identifies additive collateral overcommit. Log/router trace; no capital-readiness promotion. |
| Oct 22 07:30 | ok / 133.408 s | Admission/settlement contract for a frozen cohort; 490 closed rows. Log and smallest router update; no generated ledger or strategy change claimed. |
| Oct 23 07:30 | ok / 116.555 s | Closed-cohort collateral-admission falsifier; sensitivity to tied ordering. Log/router update; counterfactual results explicitly not strategy lift or funded feasibility. |
| Oct 24 07:30 | ok / 97.040 s | Open-position/MTM input contract; 500 rows including 10 unresolved. Log/router update; missing chronology and capital-model inputs remain gates. |
| Oct 25 08:30 | ok / 112.476 s | Entry timestamp and price-path coverage audit; 500 rows, 18 caches. Reports candle-open labels versus close-time availability, interval-censored TP/SL exits and 22 price discrepancies. |
| Oct 26 08:30 | ok / 145.930 s | Entry-price provenance audit; 14 current-cohort rounded-price mismatches. Previous cohort overwritten, so mismatch reduction is not proven repair. Log/router update. |
| Oct 27 08:30 | ok / 113.737 s | Full-level precision preflight reports 500 current triplets matching reconstructed levels. No affected current cohort; historical defect impact remains unmeasured. Log/router update. |
| Oct 28 08:30 | ok / 153.192 s | Conservative capital-release timing contract; bar-close entry/TIME_EXIT and bounded TP/SL release. Log/router update; no implementation, fund mutation or promotion. |

**Tested — source/commit attribution:** scoped git log since the window start for wiki/notes, automation/retrieval-router.yaml, automation/work-queues.yaml and automation/loop-state.yaml returned no commits. The runtime workspace and public repo files are separate, not the same file. The task document has equal size in both copies; router, queue, state and log sizes diverge. This establishes no matching repo commits in the inspected paths, not global proof that no run ever committed elsewhere. No specific F1 commit attributable to these runs was verified.

**Taken over — what the runs wrote:** October 20–28 entries repeatedly say “log plus smallest router update”; no new wiki note/bridge ingest, generated ledger, live strategy, sizing or scheduler mutation. The corresponding repository-relative paths would be log.md and automation/retrieval-router.yaml, but these writes are in the separate runtime workspace. Current trace files total 2 files / 731,100 bytes (whole-file sizes, not bytes attributable solely to autoresearch). Exact per-run changed-byte counts are not recoverable without historical snapshots.

**Tested — workspace category inventory:** these are current file counts/logical byte sizes and mtime-window subsets, not per-job attribution. Overlapping categories are not additive; changes by other jobs may dominate.

| Category | All files / bytes | Modified within requested window: files / bytes |
|---|---:|---:|
| Research notes | 225 / 1,337,726 | 1 / 6,765 |
| Research sources | 22 / 60,823 | 1 / 9,994 |
| Generated research output reports | 31 / 241,185 | 8 / 30,319 |
| Daily memory (private) | 51 / 655,016 | 4 / 17,357 |
| Handoff notes (private) | 101 / 652,830 | 2 / 21,582 |
| Chat/session logs (private) | 1,175 / 87,641,038 | 39 / 15,323,028 |
| Inbound media (private, mixed attachments) | 326 / 46,268,080 | 31 / 1,553,218 |
| Execution/watcher runtime (private) | 63 / 761,567,863 | 11 / 60,098,368 |

**Taken over / reasoning — effect:** the research notes do advance local accounting questions (time semantics, collateral admission, precision and missing-input gates) and change the next router action. They do not claim a strategy promotion. No causal update to current F1 decisions, docs/ledger.md or a current main-line backlog item was verified. The selected paper-fund task is repeatedly described as already completed; following successive accounting subquestions has become detached from the main-line queue. Absence of a verified reader/decision link is not proof that nobody ever reads these notes.

**Tested / taken over — contract mismatch:** automation/ralph-autoresearch-loop.md and the enabled payload start from pre-F1 flywheel/router/queue state, prioritizing DEMO-SIM paper-fund tasks. docs/MAP.md explicitly archives that routing, identifies F1 as the main line and says no F1 hypothesis has yet been tested. I59 tracks F1a-3 completion and F1a-4 funding next. I63 says autoresearch is to become a research desk and adversarial later a factory-output critic; decision 45 makes repo docs the one source of truth.

**Reasoning — recommendation: redirect, not silently continue or retire all research.** Rebuild it as the I63 bounded research desk after the ops-supervisor plan: current docs/MAP.md first, one requested F1 evidence gap or prior-art question per run, a concrete reviewed repo deliverable, explicit consumer/decision link, no live/runtime mutations. Near-term useful targets are evidence gaps for funding/F1a reassessment, without duplicating the existing F1a-4 prior-art report or implementing an unapproved phase. Consolidate the existing timestamp/capital-model findings into a proposed F1 issue only where applicable. A separately approved pause is preferable while the redirected contract is being reviewed; do not change cadence or enable a replacement here.

## T4. Other jobs, timers, cron and consumers

**Tested — user timer journal counts:** parsed all available JSON records in the 14-day window, counted systemd “Finished” and “Failed to start” events, and separately scanned messages for error/failed/exception/Traceback. These are service-completion evidence, not remote artifact integrity tests.

| Timer/service | Finished / failed-to-start | Other evidence / output and reader |
|---|---:|---|
| ralph-archive-upload | 336 / 0 | 78,528 journal rows, zero error-like messages. Unit/source: hourly collector archive upload. Archive/restore consumers intended; remote restore/readership not tested. |
| ralph-storage-maintenance | 336 / 0 | 16,605 rows, zero error-like messages. Compresses/retains collector files; downstream archive/data readers. Unit has retention and deletion flags already configured; nothing triggered here. |
| ralph-disk-alert | 336 / 0 | 1,140 rows, zero error-like messages. Disk threshold state and gated operator alert; actual alert receipt not verified. |
| ralph-data-checks | 14 / 0 | 194 rows, zero error-like messages. Daily checks, configured commit/push to data-checks repo; reports intended for operator/research. Remote repository delivery not verified here. |
| launchpadlib-cache-clean | 0 / 0; 14 skips | All 14 messages report unmet cache-path condition. Not 14 successes and not 14 failures; no useful output while that cache is absent. |

**Tested / not verified — system timers:** latest recorded service Result=success and ExecMainStatus=0 for the 16 loaded timer targets, but inactive/never-triggered targets also report default success. Therefore only a nonempty LastTriggerUSec supports a recorded trigger, not a successful historical run. All system-timer 14-day ok/error counts are **not verified** because the journal returned no accessible records. Dormant installed definitions have no demonstrated executions. Their schedules/purposes/status are in the opening table. No failed-system-job count is inferred from an empty journal.

**Tested — OpenClaw retained counts:** adversarial 7 ok / 0 error (Oct 22–28); alert-edge 42 ok / 0 error (Oct 21 evening–28 afternoon); weekly 0 ok / 1 error; autoresearch 7 ok / 0 error. **Not verified:** full 14-day counts. A successful model run is not proof that its output changed a decision or that a human received it.

**Taken over — adversarial purpose and actual output:** payload/source runs automation/ralph-adversarial-improvement-loop.mjs, writes a JSON/Markdown report and reads it for a high/critical gate. Tested latest report: three findings, one medium (walk-forward-near-miss-pressure), two informational (v6-blind-state-of-edge-paused, zero-survivor-state); notifyTomas=false. The job itself consumes the report; maintenance also checks its freshness. Human consumption and any current F1 decision change are not verified. It is not presently the I63 factory critic.

**Taken over — alert-edge purpose and outputs:** payload runs 10 sequential index/universe/backtest/DEMO-SIM/shadow/event-study/report commands; expected outputs are 20 artifact families including monitor/journal indexes, universe/edge snapshots, replay/ledger/walk-forward reports and state-of-edge. Source/payload show autoresearch consuming replay/accounting artifacts, adversarial consuming research outputs, and report/index readers. Latest retained summaries report no promotion and a persistent empty fit sample/zero walk-forward-survivor blocker. These are run claims, not independently recomputed performance in this inventory. Private execution artifacts are not published here.

**Taken over / reasoning — retain alert-edge pending F1 replacement:** ledger I45 explicitly says six runs/day until F1 replaces it, with no reduction to once/day or systemd move. This inventory does not supersede that decision. Repeated unchanged blockers and high model overhead justify a proposal for deterministic refresh/gating and an explicit downstream decision owner, but not a silent schedule change.

**Tested / reasoning — duplicate and unread output assessment:**

- Disabled ralph-state-of-edge-daily overlaps the report already generated by alert-edge. Disabled bybit-execution-reactor automation overlaps the running reactor process. These are dormant duplicates, not concurrent active duplicate jobs.
- Daily autoresearch and six-times-daily alert-edge inspect overlapping legacy paper-fund/replay state. Autoresearch adds accounting diagnostics, so they are not identical calculations, but no current F1 consumer was verified for those daily diagnoses.
- Adversarial normal reports are read by the job itself and checked by maintenance; human consumption unverified. Do not label them “nobody reads” as a tested fact.
- All 14 launchpad-cache attempts were condition skips: a genuinely idle scheduled path, not a failing production collector.
- System cron sysstat/e2scrub and daily dpkg/logrotate/man-db/apt compatibility scripts look duplicated beside systemd timers. Source guards skip them on a systemd host; debian-sa1 has the same guard. No duplicate collection inferred solely from both definitions existing.
- Cron daily apport cleanup remains a distinct path. The short-watch supervisor's every-minute and reboot lines intentionally converge on the same supervisor, not two independently approved strategies. Watcher processes were observed; no watcher was restarted.
- User crontab execution counts are not verified; the supervisor's private log was not published. System cron historical counts and other accounts' crontabs are not verified. Current-user atq returned empty; other accounts' deferred queues remain unverified.

## T5. RAM, OOM visibility and priority proposal

**Tested — step-2 snapshot:** RAM 3,814 MiB total, 3,237 used, 130 free, 577 available; swap 2,047 total, 1,517 used. Available RAM, not raw free alone, is the useful headroom indicator. This snapshot shows limited headroom and substantial swapped pages, not proof of current swap thrashing.

**Tested — attribution from follow-up PID/command inspection:** the largest MainThread is the OpenClaw gateway; the next large MainThread is the real-time market watcher. The four collector Python processes account for about 622 MiB RSS in the step-2 size range; Codex and MCP subprocesses add material overhead. The gateway service cgroup was 2,246,795,264 bytes current (~2,143 MiB), peak 3,094,519,808 (~2,951 MiB), active since Oct 21 08:35:14 UTC. Its own process RSS was ~1,407 MiB. Cgroup memory includes descendants and accounting other than process RSS; do not add gateway cgroup memory to all child RSS as independent consumption. System slice later reported ~142 MiB. Disk file sizes in T3 are not RAM use.

**Not verified — OOM events over 14 days:** prescribed kernel query exposes a visibility warning and no OOM lines. A follow-up privileged read required a password; another unprivileged query remained empty. No claim of “zero OOM events” is justified. The weekly maintenance claim of no OOMs is taken over from that run, not a substitute for kernel evidence.

**Tested — protection/cap gap:** all four collector units currently show MemoryLow=0, MemoryMax=infinity, OOMScoreAdjust=200 and default CPUWeight. Gateway also has MemoryMax=infinity and OOMScoreAdjust=200. Archive-upload and data-checks have 1 GiB MemoryMax plus 50% CPU quota; storage-maintenance has 50% CPU but MemoryMax=infinity. The failed archive one-shot has 1 GiB/50%. Separate per-unit quotas do not enforce a single aggregate heavy-job budget.

**Reasoning — proposal only, requiring a plan and second opinion before runtime changes:**

1. Protect collector continuity with a measured memory reserve/priority policy (relative OOM priority, MemoryLow where supported, CPU/I/O priority); keep v1 and short watchers untouched. Budget from observed working sets and burst tests, not arbitrary hard collector caps.
2. Put genuinely heavy work under one controlled admission path with a 1 GiB memory ceiling and 50% CPU ceiling, concurrency one, including compression/research subprocesses. Verify cgroup membership/descendant accounting and failure behavior. Review the uncapped storage-maintenance case explicitly.
3. “Heavy mode” records the exact prior enabled state of the four OpenClaw automations, pauses only new scheduled admissions, checks/drains existing runs without changing collectors/watchers, and starts the approved heavy job only after headroom is verified. Do not stop the gateway merely to suppress scheduled jobs.
4. Restoration must preserve preexisting disabled jobs and intervening owner edits, handle job failure/reboot, and use a bounded lease/expiry with an external watchdog outside the heavy cgroup. Restore only what this mode changed; no blind enable-all. Explain missed-run/catch-up semantics and verify delivery.
5. Review acceptance tests, failure/rollback, OOM observability and alert route in a second opinion. No implementation, new recurring monitor, pause, restart or config edit is performed here.

## T6. Broken, stale or risky items (P0–P3)

**Reasoning — severity rubric:** P0 current critical loss/outage; P1 high-priority exposure or resource-control gap; P2 functional/strategic/observability defect; P3 housekeeping. No P0 is established by accessible evidence.

| Grade | Label and evidence | Finding / proposed next action |
|---|---|---|
| P1 | Tested resource properties; reasoning risk | Storage maintenance lacks the required memory cap, collectors have no differentiated OOM protection, and available memory is only 577 MiB at snapshot. Review the bounded-heavy/protected-collector plan before further heavy work; no OOM event is asserted. |
| P1 | Tested existing tracked automation task text; taken over public-repo status from this task | The existing public autoresearch task embeds a private delivery identifier. It is not repeated in this inventory. Propose a separate reviewed redaction/credential-routing cleanup; do not amend history or edit another file here. |
| P2 | Tested current error plus installed documentation | Weekly maintenance cannot perform its required cross-job health check; two consecutive errors in current state. Implement a reviewed I63 ops-supervisor access contract or narrow the existing check. |
| P2 | Tested payload/docs divergence; reasoning | Autoresearch follows archived pre-F1 routing and writes to a second, divergent workspace knowledge copy. Redirect to the I63 research desk with a current F1 consumer and reviewed repo outputs. |
| P2 | Tested read-access limits | Full 14-day automation history, system timer success/failure counts and kernel OOM evidence are unavailable. Establish minimal read-only observability/retention before treating a health report as complete. |
| P2 | Tested memory-search response | Memory recall is unavailable because the index was built for fts-only while the configured embedding model expects text-embedding-3-small. Suggested index-rebuild command is mutating and may incur provider cost; not run. |
| P2 | Tested failed unit; cause not verified | ralph-w1-archive remains failed, exit 1 at Oct 19 07:19:06. Journal confirms failure but no specific cause was recovered. Do not rerun a deletion-capable archive command; review its original manifest/report under a separate approved task. |
| P2 | Tested extra verifier mismatch, outside scheduled entrypoint set | Non-scheduled strategy-filter verifier differs between workspace and repo. Reconcile intended source before any future run/deployment; no active verifier drift claimed. |
| P2 | Taken over research logs; reasoning | Rolling replay overwrites prevent reproducing prior precision/accounting findings from current inputs. Freeze input identity plus actual required data for a future approved test; hashes alone do not preserve overwritten cohorts. |
| P3 | Tested docs comparison | docs/state.md still names F1a-3 as next while MAP/I59 mark it done and funding next. Follow MAP; propose a separate reviewed state refresh. |
| P3 | Tested 14 journal condition skips | launchpadlib cache timer does no useful cleanup while its condition remains unmet; optional housekeeping review, not a collector problem. |
| P3 | Tested service description vs timer | ralph-data-checks service says “hourly” but timer runs daily at 00:20 UTC. Treat the timer as authoritative and correct wording in a separate change if desired. |

**Reasoning — bottom line:** collectors are writing and checked source copies match; the principal verified weaknesses are RAM isolation, incomplete historical visibility, a broken maintenance authority contract and legacy research routing without a verified current F1 decision link. None requires silently changing a running job during this inventory.


## Raw output

Verbatim step-2 output with only the complete “== openclaw automations” section omitted; automation inventory is summarized above.

```text
== date
Wed Oct 28 19:47:54 UTC 2026
== uptime
up 19 weeks, 4 days, 3 hours, 49 minutes
== memory (MiB)
               total        used        free      shared  buff/cache   available
Mem:            3814        3237         130           3         715         577
Swap:           2047        1517         530
== top RSS (KiB, process name)
1440792 MainThread
283976 MainThread
248476 python
223980 python
207956 codex
122060 npm exec @model
121004 npm exec @model
101680 python
100116 MainThread
79792 MainThread
79136 MainThread
62348 python
58148 MainThread
55252 MainThread
49196 MainThread
== gateway unit
MemoryCurrent=2246795264
MemoryPeak=3094519808
ActiveEnterTimestamp=Wed 2026-10-21 08:35:14 UTC
== kernel OOM lines, 14 days, host field removed
Hint: You are currently not seeing messages from other users and the system.
      Users in groups 'adm', 'systemd-journal' can see all messages.
      Pass -q to turn off this notice.
== user services
bybit-execution-reactor.service       loaded    active   running Bybit read-only execution reactor for Tomas
crypto-updates-market-watcher.service loaded    active   running Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher
dbus.service                          loaded    active   running D-Bus User Message Bus
dirmngr.service                       loaded    inactive dead    GnuPG network certificate management daemon
gpg-agent.service                     loaded    active   running GnuPG cryptographic agent and passphrase cache
keyboxd.service                       loaded    inactive dead    GnuPG public key management service
launchpadlib-cache-clean.service      loaded    inactive dead    Clean up old files in the Launchpadlib cache
openclaw-gateway.service              loaded    active   running OpenClaw Gateway
openclaw-node.service                 loaded    active   running OpenClaw Node Host (v2026.6.6)
pk-debconf-helper.service             loaded    inactive dead    debconf communication service
ralph-archive-upload.service          loaded    inactive dead    RALPH collector Storage Box archive upload
ralph-collector-dashboard.service     loaded    active   running RALPH orderflow dashboard (localhost only)
ralph-collector-ethusdt.service       loaded    active   running Binance ETHUSDT orderflow collector for RALPH (read-only market data)
ralph-collector-hypeusdt.service      loaded    active   running Binance HYPEUSDT orderflow collector for RALPH (read-only market data)
ralph-collector-solusdt.service       loaded    active   running Binance SOLUSDT orderflow collector for RALPH (read-only market data)
ralph-collector.service               loaded    active   running Binance BTCUSDT orderflow collector for RALPH (read-only market data)
ralph-data-checks.service             loaded    inactive dead    RALPH hourly data checks
ralph-disk-alert.service              loaded    inactive dead    RALPH disk free-space alert gate
ralph-storage-maintenance.service     loaded    inactive dead    RALPH collector lossless storage maintenance
ralph-w1-archive.service              loaded    failed   failed  /usr/bin/python3 -u ~/ralph-experiment-loop-lab/tools/maintenance/research_archive.py --manifest ~/ralph-state/w1/w1-2026-10-19.csv --report ~/ralph-state/w1/report.json --delete-after-r4
snapd.session-agent.service           loaded    inactive dead    snapd user session agent
systemd-remount-fs.service            not-found inactive dead    systemd-remount-fs.service
== user timers
NEXT                            LEFT LAST                              PASSED UNIT                            ACTIVATES
Wed 2026-10-28 20:00:00 UTC    12min Wed 2026-10-28 19:04:17 UTC    43min ago ralph-disk-alert.timer          ralph-disk-alert.service
Wed 2026-10-28 20:00:00 UTC    12min Wed 2026-10-28 19:04:17 UTC    43min ago ralph-storage-maintenance.timer ralph-storage-maintenance.service
Wed 2026-10-28 20:40:00 UTC    52min Wed 2026-10-28 19:44:17 UTC 3min 36s ago ralph-archive-upload.timer      ralph-archive-upload.service
Thu 2026-10-29 00:20:00 UTC 4h 32min Wed 2026-10-28 00:20:17 UTC      19h ago ralph-data-checks.timer         ralph-data-checks.service
Thu 2026-10-29 18:04:20 UTC      22h Wed 2026-10-28 18:04:20 UTC 1h 43min ago launchpadlib-cache-clean.timer  launchpadlib-cache-clean.service

5 timers listed.
== system timers
NEXT                            LEFT LAST                                  PASSED UNIT                           ACTIVATES
Wed 2026-10-28 19:50:00 UTC  2min 5s Wed 2026-10-28 19:40:01 UTC         7min ago sysstat-collect.timer          sysstat-collect.service
Thu 2026-10-29 00:00:00 UTC 4h 12min Wed 2026-10-28 00:00:01 UTC          19h ago dpkg-db-backup.timer           dpkg-db-backup.service
Thu 2026-10-29 00:00:00 UTC 4h 12min Wed 2026-10-28 00:00:01 UTC          19h ago logrotate.timer                logrotate.service
Thu 2026-10-29 00:07:00 UTC 4h 19min Wed 2026-10-28 00:07:00 UTC          19h ago sysstat-summary.timer          sysstat-summary.service
Thu 2026-10-29 04:03:56 UTC       8h Wed 2026-10-28 19:08:10 UTC        39min ago motd-news.timer                motd-news.service
Thu 2026-10-29 06:20:00 UTC      10h Wed 2026-10-28 06:20:13 UTC          13h ago apt-daily-upgrade.timer        apt-daily-upgrade.service
Thu 2026-10-29 09:04:40 UTC      13h Wed 2026-10-28 01:15:15 UTC          18h ago man-db.timer                   man-db.service
Thu 2026-10-29 16:25:30 UTC      20h Wed 2026-10-28 16:25:30 UTC     3h 22min ago update-notifier-download.timer update-notifier-download.service
Thu 2026-10-29 16:40:16 UTC      20h Wed 2026-10-28 16:40:16 UTC      3h 7min ago systemd-tmpfiles-clean.timer   systemd-tmpfiles-clean.service
Thu 2026-10-29 17:13:21 UTC      21h Wed 2026-10-28 18:45:52 UTC      1h 2min ago apt-daily.timer                apt-daily.service
Fri 2026-10-30 04:49:22 UTC 1 day 9h Tue 2026-10-20 16:29:39 UTC 1 week 1 day ago update-notifier-motd.timer     update-notifier-motd.service
Sun 2026-11-01 03:10:35 UTC   3 days Sun 2026-10-25 03:10:47 UTC       3 days ago e2scrub_all.timer              e2scrub_all.service
Mon 2026-11-02 00:40:17 UTC   4 days Mon 2026-10-26 00:42:35 UTC       2 days ago fstrim.timer                   fstrim.service
-                                  - -                                          - apport-autoreport.timer        apport-autoreport.service
-                                  - -                                          - snapd.snap-repair.timer        snapd.snap-repair.service
-                                  - -                                          - ua-timer.timer                 ua-timer.service

16 timers listed.
== crontab
# OPENCLAW-SHORT-WATCHERS-BEGIN
@reboot ~/.openclaw/workspace/scripts/ensure-short-watchers.sh >> ~/.openclaw/workspace/.tmp/short-watchers-supervisor.log 2>&1
* * * * * ~/.openclaw/workspace/scripts/ensure-short-watchers.sh >> ~/.openclaw/workspace/.tmp/short-watchers-supervisor.log 2>&1
# OPENCLAW-SHORT-WATCHERS-END
== end
```
