# Connect an AI to Stride

Stride 0.4 adds an optional, read-only MCP connection in the **desktop app**.
Open **AI connection** beside **App updates** and **Quit Stride**, at the bottom
of the browser dashboard. The CLI dashboard does not enable this connection.

Access starts off. Turning it on starts a separate authenticated service bound
only to `127.0.0.1`. It does not publish the dashboard or contact an AI provider.
An AI client can read your synced runs once you explicitly connect it.

## ChatGPT setup

This is a personal developer-mode integration, not a reviewed public plugin.
ChatGPT's developer-mode warning applies: connect only tools you trust. Stride
exposes only the five read tools listed below. Your requested run data and notes
will be sent to ChatGPT, whose normal account policies and usage limits apply.

1. Install OpenAI's official `tunnel-client` helper. On Mac:

   ```sh
   brew install openai/tools/tunnel-client
   ```

   If Homebrew asks for newer Apple Command Line Tools, update them through
   System Settings → General → Software Update before retrying. On Windows,
   use the Windows download from the [official helper releases](https://github.com/openai/tunnel-client/releases/latest),
   extract it, and enter the full path to `tunnel-client.exe` under **Install the
   connection helper** in Stride. Stride never downloads or executes a helper
   automatically.
2. In ChatGPT, enable Developer mode under **Settings → Security and login**.
   Availability depends on your account and workspace policy.
3. In [OpenAI Platform tunnel settings](https://platform.openai.com/settings/organization/tunnels),
   create a tunnel and associate it with your ChatGPT workspace. The tunnel ID
   starts with `tunnel_`. You need Tunnels Read + Manage to create it, and Read +
   Use to run it. Platform and ChatGPT permissions are separate.
4. Create a **runtime API key** in your Platform organization with the required
   tunnel access. Do not use an admin API key or paste any key into a chat.
5. In Stride, enable **Allow AI access to my running journal**. Enter the tunnel
   ID and runtime key, then select **Connect**. Stride saves the key privately
   in its data folder and starts the official helper. It does not make model
   inference calls. Tunnel service availability/costs are controlled by OpenAI;
   this app does not promise that an external service will always be free.
6. Once the helper reports readiness, open [ChatGPT Plugins](https://chatgpt.com/plugins),
   add **Stride**, choose **Tunnel**, and select the same tunnel. Add the
   connection to a chat. Try: “List my three latest runs”, then “Analyse the
   latest one” or “Compare it with a similar earlier run.”

Keep Stride running and your computer awake. Sync Garmin in Stride when you want
new activities available. This connection does not sync your watch on demand.
The helper reconnects on the next app launch after successful local setup.

**Turn access off** stops both the local service and the helper. Re-enabling
local access does not automatically restart the ChatGPT helper; select Connect.
**Forget ChatGPT connection** stops the helper and removes its saved runtime key
and configuration. Local access for other AI clients stays enabled until you
turn it off. Removing the connection in ChatGPT and revoking the runtime key in
Platform are separate account actions.

## Other MCP clients

Use a client that supports Streamable HTTP MCP with custom request headers:

- URL: the local URL shown in Stride's **Other AI clients / local connection**.
- Header: `X-Stride-AI-Key`, with the private connection key shown there.

Both the port and key persist across app restarts. This key grants read access to
all running activities and notes in the local journal while access is enabled.
Keep it private. The service rejects browser-origin requests, unexpected Host
headers, missing/wrong keys, and all paths other than `/mcp`. Never forward the
existing dashboard port to the internet. No public HTTPS/OAuth deployment is
included in this release.

## Available tools

| Tool | Reads |
| --- | --- |
| `list_runs` | Newest-first run summaries, date filters and pagination (up to 100 per page) |
| `get_run` | A selected run's metrics, laps, workout and notes; optional series capped at 1,200 samples |
| `find_similar_runs` | Up to five earlier runs using the dashboard's existing matching rules |
| `compare_runs` | Two explicitly selected runs, including laps and notes |
| `training_summary` | 28/90/365-day aggregates versus the preceding equal period |

Tools have no file-path, URL, credential, sync, deletion, settings or note-writing
parameters. They reuse the existing library and calculations. GPS coordinate
fields, filenames, local paths, device details and body profiles are excluded.
Free-text notes and workout names are shared as written; avoid putting information
there that you do not want your AI to receive. Garmin credentials are never read
by the MCP service. The helper receives only an OpenAI runtime key and a separate
local read-access key, not the dashboard's control token.

Credentials are stored under `<Stride data directory>/ai/`, with owner-only
file permissions on macOS/Linux; Windows uses the user's application-data folder
and its inherited permissions. They are not encrypted by Stride. Protect backups
of this folder as credentials. Nothing is included in release packages.

## Validation and current limits

Automated tests use synthetic runs and the official MCP SDK client. Packaged-app
smoke tests check opt-in, initialization, tool discovery, a read request, disable,
and shutdown. Live ChatGPT discovery and an actual run analysis still require
your own tunnel/account setup and are not implied by the local tests passing.

Official references:
[Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels),
[ChatGPT connection setup](https://developers.openai.com/plugins/deploy/connect-chatgpt).
