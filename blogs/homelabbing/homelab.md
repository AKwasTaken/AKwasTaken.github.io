---
title: A Painful Homelabbing Journey
date: 2026-04-15
---

This is a chronological log of my experience with setting up a personal home server on a Linux Mint Laptop (Acer ES1-132) on a campus network (IISER TVM), known for its heavy restrictions (Sophos firewalls, captive portals, subnets).

This blog documents what I tried, what worked, and what failed.

## Phase 0: Initial Setup

> **Goal:** Turn a crappy Linux Mint laptop into a basic home server.

I started with Ubuntu, but that had a lot of issues (that I don't even want to talk about), then installed a clean distro of Linux Mint. Why Mint? It is optimized for performance, and my laptop has a sum total of **4 GB of RAM**.

### What I Did:

- Installed Linux Mint on the laptop, set up the user account, and connected to the campus WiFi to verify internet access.
    
- **SSH Setup:** Essential for remote access-ing into my server-laptop from my Mac.
    
    Bash
    
    ```
    sudo apt update
    sudo apt install openssh-server
    sudo systemctl enable --now ssh
    ```
    
- **Finding the IP:** Ran `hostname -I` to get the local IP and connected from my Mac via `ssh username@<ip-address>`.
    
    - _The Catch:_ This only worked inside the same network initially, and the IP changes every single time the laptop reconnects to the WiFi. Annoying.
        
- **Directory Layout & Permissions:** Set up basic folders for future data and fixed ownership mismatches:
    
    Bash
    
    ```
    mkdir -p ~/Jellyfin/Films ~/Jellyfin/TV ~/Movies
    sudo chown -R akwastaken:akwastaken ~/Jellyfin
    chmod -R 775 ~/Jellyfin
    ```
    
- **Shell Scripting Basics:** Created simple automation scripts, tossed them into `nano script.sh`, made them executable with `chmod +x`, and moved them to `/usr/local/bin/script` so they work globally.
    
---

## Phase 1: The Minecraft Server

> **Goal:** Host a legit Minecraft server locally. This was my first exposure to running long-lived processes and server configuration.

### Java Setup:

I needed Java 21. I ran into a few errors while installing it, but got it fixed. Those errors I deem detrimental to a blog such as this, so we move.

Bash

```
sudo apt update
sudo apt install openjdk-21-jdk
```

### Server Execution:

1. Created `mkdir ~/mcserver` and grabbed the server jar via `wget` (specific version links can be found on Mojang's site).
    
2. Ran it the first time: `java -Xmx2G -Xms2G -jar server.jar nogui`.
    
3. Crashed because of the EULA. Opened `nano eula.txt`, changed `eula=false` to `eula=true`, and fired it up again.
    
4. **Success!** My friends and I could join using `<ip-address>:25565`, but _only_ within the exact same WiFi network. No remote access yet. Later experimented with a Modded Server using the Fabric Server Loader (which requires matching client-side mods).
    

---

## Phase 2: Download Tools

> **Goal:** Download media files efficiently onto the server.

### Attempt 1: aria2c (CLI)

I tried using `aria2c` as a CLI torrent downloader. Massive headache.

- When running `aria2c "magnet:?xt=..."`, the command would split incorrectly due to the `&` symbols in the link, triggering multiple chaotic background jobs.
    
- It gave me endless DHT routing table issues, zero peers, and no progress. It's powerful, but way less intuitive for torrent management and magnet links.
    

### The Fix: qBittorrent-nox

This is a web-version of qBittorrent that you can access via a web UI from anywhere using the server's IP.

Bash

```
sudo apt install qbittorrent-nox
```

If you just run `qbittorrent-nox`, it keeps the program trapped in your open SSH terminal. To avoid this, I ran it as a daemon instance:

Bash

```
qbittorrent-nox -d
```

Downloads worked reliably, peer discovery was automatic, and pointing the download directories to `~/Jellyfin/TV` and `~/Jellyfin/Films` was a breeze after I re-fixed folder permissions with `chmod -R 775`.

---

## Phase 3: Plex (Failed Attempt)

> **Goal:** Set up a mainstream media server.

- **What worked:** Local streaming.
    
- **What failed:** Remote streaming outside the network completely broke. The setup heavily relies on Plex Relay or paid subscriptions to bypass network restrictions.
    
- **Conclusion:** Plex is not ideal for highly restricted networks. A huge headache. Deprecated immediately.
    
---

## Phase 4: Jellyfin (Major Success)

> **Goal:** A completely local, restriction-free media server to completely replace Plex.

Bash

```
sudo apt install jellyfin
sudo systemctl enable --now jellyfin
```

I opened up `http://<server-ip>:8096` in my browser, skipped the metadata options initially to keep things fast, and linked my `~/Jellyfin/Films` and `~/Jellyfin/TV` folders.

It scanned and detected everything automatically. I tested it on my phone using the iOS app **Streamyfin** via the local IP—playback worked flawlessly. No external accounts needed, clean UI, and highly reliable local streaming.

---

## Phase 5: Networking Problems Begin

> **The Reality Check:** The campus network is actively hostile to homelabs.

### The Obstacles:

- The WiFi requires manual login through a **captive portal** (`https://gateway.iisertvm.ac.in:8090/httpclient.html`).
    
- The internet completely cuts out after the portal session expires. Since the server has no display, I can't just open a browser to log back in.
    
- The IP address changes constantly on reconnect.
    
- **Subnet Isolation:** Devices on the campus network are split into different subnets. Just because my phone and server are on the "same" WiFi doesn't mean they can talk to each other.
    
- Using `<hostname>.local` (mDNS) only worked sporadically and completely failed across different subnets. I tried automated `curl` login scripts, but the portal's login tokens change dynamically, making automation highly unreliable.
    
---

## Phase 6: SSH Tunneling

> **Goal:** Remotely access the campus login portal through the server.

I tried using SSH local port forwarding to bridge the gap:

Bash

```
ssh -L 8090:gateway.iisertvm.ac.in:8090 akwastaken@<server-ip>
```

- **How it works:** This opens port 8090 on my Mac and forwards all traffic directly to the campus gateway through the server. I could go to `http://localhost:8090/httpclient.html` on my Mac and interact with the login portal remotely!
    
- **The Problem:** It requires an active, manual SSH session. I tried running it in the background (`ssh -f -N -L ...`), but if the port is already in use, it fails. It's a neat temporary trick, but not scalable.
    
---

## Phase 7: VPN Setup (sshvpn)

> **Goal:** Use the official campus VPN to bypass the captive portal altogether.

I grabbed the `.ovpn` file from the campus VPN portal, installed OpenVPN, and set up a credentials file (`creds.txt`) containing my username and password inside `/etc/sshvpn/`.

### Automation via systemd:

Running it manually blocks the terminal, so I wrapped it into a systemd service (`/etc/systemd/system/sshvpn.service`):

Ini, TOML

```
[Unit]
Description=OpenVPN SSH VPN
After=network.target

[Service]
ExecStart=/usr/sbin/openvpn --config /etc/sshvpn/config.ovpn --auth-user-pass /etc/sshvpn/creds.txt
Restart=always
User=root

[Install]
WantedBy=multi-user.target
```

I then built a custom bash wrapper script named `sshvpn` and threw it into `/usr/local/bin/` so I could manage the connection globally using simple commands like `sshvpn start`, `sshvpn stop`, and `sshvpn update <path-to-ovpn>`.

- **The Result:** The VPN successfully connected, and internet access worked without ever needing the captive portal.
    
- **The New Problem:** The second the VPN starts, it completely overrides the routing table, breaking existing local connections and dropping my active SSH terminal. Managing it remotely became a game of chess.
    

---

## Phase 8: Tailscale (Breakthrough)

> **Goal:** Stable remote access from _anywhere_ without dealing with local IPs, subnets, or port forwarding.

Bash

```
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

- **The Magic:** Tailscale assigns the server a fixed `100.x.x.x` IP. When testing on a mobile hotspot, it worked flawlessly. I could SSH into the server and access all my services from absolutely anywhere.
    
- **The Campus Firewall Boss Fight:** The moment I switched back to the raw campus WiFi, Tailscale dropped. The Sophos firewall blocks Tailscale's control/coordination traffic entirely, causing connection resets and auth failures.
    
- **The Workaround:** If I connect the server to a mobile hotspot, run `tailscale up` to authenticate, and _then_ switch to campus WiFi **while the campus VPN is running**, Tailscale works! The VPN tunnels the traffic past the Sophos firewall restrictions.
    

---

## Phase 9: VPN vs. Tailscale Conflict

> **The Nightmare:** OpenVPN and Tailscale absolutely hate sharing the same routing table.

When the campus VPN starts, it forces a global routing split:

Plaintext

```
0.0.0.0/1 via <vpn-gateway> dev tun0
128.0.0.0/1 via <vpn-gateway> dev tun0
```

This forces _all_ internet traffic through `tun0`. Because the VPN overrides local routing, Tailscale's traffic gets sucked into the VPN tunnel, clashes with the Sophos firewall on the other end, and causes Tailscale to report as offline.

### Failed Fixes:

1. **Manual Route Overrides:** I tried running `sudo ip route add 100.64.0.0/10 via <local-gateway>` to force Tailscale outside the VPN. It was highly unstable and broke constantly.
    
2. **Split Tunneling:** Trying to modify the campus VPN behavior to not route everything failed because the raw campus network just goes back to blocking Tailscale.
    

### Key Insight:

There are only two stable modes here:

1. Tailscale _without_ VPN (Works only outside campus network restrictions).
    
2. Tailscale _inside_ VPN (Works because traffic is tunneled, but manual routing overrides are fragile and easily broken).
    

## Phase 10: vpnbox (Per-App VPN - DOESN'T WORK)

> **Goal:** Use Linux network namespaces to isolate the VPN traffic.

I wanted `qBittorrent` to route strictly through the campus VPN, while keeping the rest of the OS on the normal network so Tailscale wouldn't break.

### The Execution:

- Created a dedicated network namespace.
    
- Spawned the OpenVPN instance inside that namespace.
    
- Ran `qbittorrent-nox` inside that same namespace.
    

### The Failure:

It completely isolated the traffic, but it worked _too_ well. Because qBittorrent was locked entirely inside the isolated `vpnbox` namespace, I couldn't access its Web UI from the outside network. It is permanently stuck inside the box. Back to the drawing board.

## Phase 11: Dashboard!

> **Goal:** Build a clean homelab dashboard to track everything.

I saw a YouTube video of someone vibe-coding a gorgeous homelab dashboard. I wanted to avoid using AI as much as possible, so I found an open-source project called **Flame**.

### The Setup:

I spun up Docker, pulled the Flame container image, and deployed it.

### Observation:

Flame is incredibly minimalistic, but honestly, I want something that gives me actual real-time system information and metrics at a glance. Flame is a bit too barebones for my taste, so I am planning to scrap it and switch to the **Homepage** dashboard next.

---