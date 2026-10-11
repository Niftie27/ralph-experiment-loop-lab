# Storage Box template

This page is a public template. Replace placeholder values locally; do not commit the real Storage Box host,
username, or private key material.

## Connection

```sshconfig
Host storagebox
  HostName uXXXXXX.your-storagebox.de
  User uXXXXXX
  Port 23
  IdentityFile ~/.ssh/<storagebox_ed25519>
  IdentitiesOnly yes
  StrictHostKeyChecking yes
  PasswordAuthentication no
  ServerAliveInterval 30
```

Official Hetzner Storage Box ED25519 host key fingerprint:

```text
SHA256:XqONwb1S0zuj5A1CDxpOSuD2hnAArV1A3wKY7Z3sdgM
```

Before adding a `known_hosts` entry, scan the host key and compare the ED25519 fingerprint with the official
value above. Only append the scanned line when it matches.

## Remote layout

```text
ralph/
  _test/
  raw/
    BTCUSDT/
    ETHUSDT/
    SOLUSDT/
    HYPEUSDT/
  derived/
    BTCUSDT/
    ETHUSDT/
    SOLUSDT/
    HYPEUSDT/
research/
```

## Safety rules

- Never delete files on the box as part of setup or connectivity testing.
- Never overwrite `.ssh/authorized_keys` on the box.
- Leave test uploads in `ralph/_test/` unless Tomas explicitly approves cleanup later.
- Keep public documentation placeholder-only for host, username, and key details.
