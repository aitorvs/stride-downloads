# Connect an AI to Stride

Stride 0.4 adds an optional, read-only MCP connection in the **desktop app**.
Open **AI connection** beside **App updates** and **Quit Stride**, at the bottom
of the browser dashboard. The CLI dashboard does not enable this connection.

Access starts off. Turning it on starts a separate authenticated service bound
only to `127.0.0.1`. It does not publish the dashboard or contact an AI provider.
An AI client can read your synced activities and notes once you explicitly connect it.

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
exposes only the twelve read tools listed below. Your requested run data and notes
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
all imported activities and notes in the local journal while access is enabled.
Keep it private. The service rejects browser-origin requests, unexpected Host
headers, missing/wrong keys, and all paths other than `/mcp`. Never forward the
existing dashboard port to the internet. No public HTTPS/OAuth deployment is
included in this release.

## Available tools

| Tool | Reads |
| --- | --- |
| `server_info` | Running app/interface versions, schema fingerprint, instance ID, tool names and capabilities; no private journal data |
| `recovery_trends` | Personal HRV, resting-HR and sleep trends versus a preceding baseline, usable-day coverage, measurement times and exclusions |
| `coach_context` | Compact coaching briefing: latest form with freshness flags, check-ins, recent training, activity IDs, coverage and next steps |
| `current_form` | Garmin daily readings, check-ins and recent training; measurement dates and stale/missing status |
| `library_status` | Local running count and date bounds, unreadable file count, last recorded sync attempt and last successful sync scope; completeness remains unknown |
| `list_runs` | Newest-first summaries; date, workout/note text, workout type, distance and moving-duration filters; pagination (up to 100 per page) |
| `list_activities` | All activities, non-running context (`sport=other`), or a specific FIT sport; date/search filters, notes and pagination |
| `get_activity` | Session metrics, recorded laps, planned workouts, executed steps and notes for supporting activities, without running-specific interpretation |
| `get_run` | A selected run's metrics, laps, workout and notes; optional series capped at 1,200 samples |
| `find_similar_runs` | Up to five earlier runs using the dashboard's existing matching rules |
| `compare_runs` | Two explicitly selected runs, including laps and notes |
| `training_summary` | Custom inclusive dates or 1–3,650 days ending at a chosen date; running aggregates plus other training grouped separately by sport, versus the preceding equal period (default 90 days ending today) |

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

For fast local testing without a release, see [the development loop](../packaging/README.md#fast-local-development-on-mac).

Official references:
[Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels),
[ChatGPT connection setup](https://developers.openai.com/plugins/deploy/connect-chatgpt).

## Other training as running context

Garmin sync defaults to **Running only**. Choose **All activities** to import
cross-training as well; the limit counts matching activities, not runs. Increase
it to include a longer history when cycling, walks or strength sessions are frequent.
The dashboard defaults to runs, with an **Other training** filter and a seven-day
context summary. Supporting activities have basic metrics and autosaved notes;
record effort and strength focus in notes when useful. Running trends, totals and
comparisons remain running-only.

Run reports and JSON include up to 20 other activities from the preceding seven
calendar days, including the run date, with notes and unknown coverage. Check
`total`/`next_offset` or use `list_activities` for additional context. Sessions later
on the same calendar date may be included; timestamps identify their order.
Training summaries include separate `other_training` and `prior_other_training`
by sport. Missing duration/intensity stays unknown; cross-sport distance is never
added to running distance. This does not infer recovery or training load.

AI clients can discover supporting sessions with `list_activities`, then read laps
and workout steps with `get_activity` when intensity or recovery context matters.
MCP cannot download from Garmin or start sync; import missing history in Stride.

### Current form

`current_form(days=7)` reads locally imported Garmin readiness, recovery time, training status and load, sleep, HRV and resting heart rate, plus personal check-ins and seven days of training context. Refresh these in Stride’s Current form view after syncing your watch. Availability depends on the device and Garmin account. Readings retain their measurement date and retrieval time; failed refreshes preserve previous values as stale. This tool never contacts Garmin. Enabled AI access includes these readings and check-ins.

Copied activity reports and downloaded JSON also include seven days of locally imported Current form readings and check-ins, plus current seven-day training totals. This evidence is labelled as current at export time, separately from the activity date; it must not be treated as pre-activity evidence for an older session. Comparisons share one form context. Refresh Current form before exporting to update the readings. No export contacts Garmin.

### Starting a coaching conversation

Start with `coach_context(days=7, activity_limit=20)`. It combines the latest imported readings (looking back up to 30 days), recent check-ins, separate running and other-training totals, and a bounded page of activity summaries with IDs. The requested period ends today; days is 1–30 and activity_limit is 1–50. Follow the returned `get_run` or `get_activity` references only when details matter. Page through `list_activities` if more summaries are needed. Notes are limited to 1,000 characters with truncation flags; `current_form` provides full check-in notes and daily history. Activity detail tools avoid repeating the full form briefing.

A reading is labelled current only if its measurement date is today and its import is no older than 24 hours. Old values, failed refreshes and unknown timestamps remain explicit. This label describes data freshness, not recovery. The briefing suggests refreshing Current form, asking how the athlete feels, or importing missing history as appropriate. All actions are suggestions; MCP remains read-only and never contacts Garmin.

### Personal recovery trends

`recovery_trends(recent_days=7, baseline_days=28)` compares the recent period ending today with the immediately preceding baseline. Recent days is 1–14; baseline days is 14–60. It returns daily last-night HRV, resting HR, sleep duration and sleep score, together with daily timing and data-quality flags, means, medians and ranges. Differences are available only with at least 70% usable days in each period and at least 14 usable baseline days. This is a transparent data-coverage rule, not a clinical threshold. Missing values are never treated as zero; failed refreshes and measurement-date mismatches are excluded. Sparse means remain visible and marked insufficient.

To populate the default comparison, select **Last 35 days · build a baseline** in Current form and refresh Garmin readings. This longer import is optional and can take more time. The dashboard history displays up to 30 days; recovery trends reads the complete requested window. Longer baselines become available as imported history accumulates. Device availability may still leave readings missing. The observed baseline is distinct from Garmin’s balanced HRV range, and the tool calculates no readiness score or workout prescription.

Coaching instructions now explicitly distinguish faster mixed-run averages from evidence of improved fitness, locally recorded volume from actual volume when coverage is unknown, and possible cadence lock from confirmation. Recovery readings must be matched to workout measurement times; an import timestamp does not prove a reading includes a later activity.

The same interpretation guidance is included in MCP connection instructions, `coach_context`, `current_form`, `recovery_trends`, and copied reports/JSON exports. Unknown measurement time means unknown same-day workout order; calendar dates and import times do not establish that relationship. Descriptive baselines must not become invented cutoffs or consecutive-day workout rules. Favourable recorded markers do not establish recovery or prove that training load was absorbed; the coach should consider athlete feedback and ask for it when missing. This guidance steers the AI client but cannot guarantee compliance.

### Diagnosing tool/version mismatches

Open **AI connection → Connection diagnostics** in Stride and ask the AI to call `server_info`. Compare the running app version, MCP interface version, schema fingerprint and tool list. The interface starts at `1.0.0` and uses semantic versioning: major for breaking tool contracts, minor for additive capabilities and patch for compatible corrections. The app version and negotiated MCP protocol version are separate.

The schema fingerprint hashes actual registered tool definitions and shared coaching guidance. Journal notes, credentials and app version do not affect it. The running-instance ID changes when Stride restarts; it stays the same when toggling AI access. Copy diagnostics includes neither keys, tunnel IDs, paths nor activity data.

If ChatGPT cannot see `server_info`, its saved catalog predates diagnostics or reaches another server. Confirm the running app version and matching tunnel ID, refresh the Stride connection in ChatGPT, then start a new chat. Recreating a connection forces fresh setup/discovery but is not normally necessary. A successful reinstall alone cannot identify whether the earlier issue was cached metadata, endpoint selection or a client-side refresh failure. Schema versioning does not force clients to update their catalogs.
