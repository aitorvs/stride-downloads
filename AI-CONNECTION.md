# Connect an AI to Stride

Stride 0.4 adds an optional, read-only MCP connection in the **desktop app**.
Open **AI connection** beside **App updates** and **Quit Stride**, at the bottom
of the browser dashboard. The CLI dashboard does not enable this connection.

Access starts off. Turning it on starts a separate authenticated service bound
only to `127.0.0.1`. It does not publish the dashboard or contact an AI provider.
An AI client can read your synced runs once you explicitly connect it.

## Claude Desktop setup

1. In Stride, enable **Allow AI access to my running journal**.
2. In the **Claude Desktop** section, select **Copy Claude configuration**.
3. In Claude Desktop, open **Settings → Developer → Edit Config**. Paste the
   configuration into `claude_desktop_config.json`. If you already have MCP
   connections, merge only the `stride` entry into your existing `mcpServers`
   object; preserve the other entries and settings.
4. Save, fully quit Claude Desktop, and reopen it. Enable Stride in the
   conversation's connectors. Try “List my three latest runs”.

The packaged app includes a local stdio adapter: no Python, Node, OpenAI account,
API key or tunnel installation is needed. Source development uses the checkout's
Python interpreter instead. The generated configuration points to the current
app and library; copy a fresh configuration if you move the app or switch libraries.
It contains no connection key. The adapter reads Stride's saved private key and
port on each request, uses only loopback HTTP, and obeys the AI access switch.

Keep Stride running and AI access enabled. Disabling access immediately prevents
new reads; the adapter can retry when you re-enable it. To remove the connection,
delete only `stride` from Claude's `mcpServers` configuration and restart Claude.
This setup is for Claude Desktop on this computer, not the Claude website.
Requested data and notes are sent to Claude under your Claude account policies.

See the [official local MCP setup guide](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

## ChatGPT setup

This is a personal developer-mode integration, not a reviewed public plugin.
ChatGPT's developer-mode warning applies: connect only tools you trust. Stride
exposes only the six read tools listed below. Your requested run data and notes
will be sent to ChatGPT, whose normal account policies and usage limits apply.

1. In Stride, enable **Allow AI access to my running journal**. Expand **ChatGPT setup**
   and select **Install connection helper**. Stride finds an existing helper or downloads the current stable official `tunnel-client`
   release for your computer. It verifies the SHA-256 digest from GitHub's release
   metadata before installing it in `<Stride data directory>/ai/helper/`.
   No Homebrew, Terminal, or Apple Command Line Tools are needed. The dashboard
   shows progress and a retry button if the download fails. An existing helper
   can also be selected under **Advanced setup**. Installation alone does not
   connect your journal to OpenAI; that happens after you select Connect below.
2. In ChatGPT, enable Developer mode under **Settings → Security and login**.
   Availability depends on your account and workspace policy.
3. In [OpenAI Platform tunnel settings](https://platform.openai.com/settings/organization/tunnels),
   create a tunnel and associate it with your ChatGPT workspace. The tunnel ID
   starts with `tunnel_`. You need Tunnels Read + Manage to create it, and Read +
   Use to run it. Platform and ChatGPT permissions are separate.
4. Create a **runtime API key** in your Platform organization with the required
   tunnel access. Do not use an admin API key or paste any key into a chat.
5. Once the helper is installed, enter the tunnel ID and runtime key in Stride,
   then select **Connect**. Stride saves the key privately
   in its data folder and starts the official helper. It does not make model
   inference calls. Tunnel service availability/costs are controlled by OpenAI;
   this app does not promise that an external service will always be free.
6. Once the helper reports readiness, choose **Create MCP app** in ChatGPT,
   name it **Stride**, choose **Connection → Tunnel**, and select the same tunnel.
   Set **Authentication → No authentication**: the helper supplies Stride’s local
   access key; this server does not implement OAuth. Add the
   connection to a chat. Try: “List my three latest runs”, then “Analyse the
   latest one” or “Compare it with a similar earlier run.”

Keep Stride running and your computer awake. Sync Garmin in Stride when you want
new activities available. This connection does not sync your watch on demand.
The saved connection starts automatically on the next app launch. A ready tunnel
means the helper is connected, not that ChatGPT has finished its setup.

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
| `library_status` | Local running count and date bounds, unreadable file count, last recorded sync attempt and last successful sync scope; completeness remains unknown |
| `list_runs` | Newest-first summaries; date, workout/note text, workout type, distance and moving-duration filters; pagination (up to 100 per page) |
| `get_run` | A selected run's metrics, laps, workout and notes; optional series capped at 1,200 samples |
| `find_similar_runs` | Up to five earlier runs using the dashboard's existing matching rules |
| `compare_runs` | Two explicitly selected runs, including laps and notes |
| `training_summary` | Custom inclusive dates or 1–3,650 days ending at a chosen date; aggregates versus the preceding equal period (default 90 days ending today) |

`list_runs` and `training_summary` include coverage metadata for the requested
period; summaries also include it for the comparison period. The period's local
run count ignores search/workout filters, so no matching results can be distinguished
from no imported runs in that date range. Earliest/latest dates do not establish
complete coverage between them. Completeness is explicitly `unknown`, even after
a successful sync: a limited sync may leave older history missing, and local files
can be removed. Assistants are instructed to explain this limitation and suggest
syncing more history in Stride rather than claiming you did not run.

New Garmin download attempts record their completion time in UTC and scope (type,
limit, since date, counts) in the activity library's `.dashboard/journal.sqlite3`. Existing `sync.json` records
are imported during metadata migration and retained as backups.
Partial/failed attempts preserve the last successful sync. Libraries synced before
this tracking was added report unknown sync times. `library_status` makes no
request to Garmin and returns no file paths or credentials.

For example, ask “Find my tempo runs between 8 and 12 km” or “Summarise August
and compare it with the preceding period”. `list_runs.query` searches workout
names and notes with case-insensitive substring matching; `workout_name` searches
only workout names. Numeric bounds are inclusive, missing values do not match
numeric filters, and filters combine with AND. Distance filters use kilometres;
duration filters use moving minutes. Results retain metres, seconds and minutes/km.

`training_summary.start_date` and `end_date` use recorded calendar dates, both
inclusive. The end defaults to today. Providing a start defines the period and
overrides `days`; otherwise `days` counts backwards from the end. Future end dates
and periods longer than 3,650 days are rejected. The previous comparison period
has the same number of days, so a calendar month is compared with that many
preceding days, not necessarily the preceding calendar month.

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
and shutdown. Live Claude Desktop and ChatGPT discovery and an actual run analysis still require
your own tunnel/account setup and are not implied by the local tests passing.

Download the latest preview from [Stride releases](https://github.com/aitorvs/stride-downloads/releases).

Official references:
[Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels),
[ChatGPT connection setup](https://developers.openai.com/plugins/deploy/connect-chatgpt).
