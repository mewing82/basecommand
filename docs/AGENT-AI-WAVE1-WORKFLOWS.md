# Agent.ai Wave 1 — Workflow Agent Specs (Premium)

**Last updated:** 2026-03-20
**Reference:** `docs/LLM.txt` (Agent.AI Actions Generator)
**Architecture:** Workflow Agents with HubSpot OAuth → auto-pull → AI analysis → write-back

---

## How These Work

1. User opens the agent on agent.ai
2. Clicks "Connect HubSpot" (one-click OAuth — agent.ai handles all auth complexity)
3. Agent automatically pulls their data via HubSpot v2 actions
4. AI analyzes everything and produces results
5. Results displayed beautifully + optionally written back to HubSpot + saved to BaseCommand

**No pasting. No exporting. No CSV uploads.** Connect and go.

### Runtime Auto-Variables (available in every step)
- `{{hubspot_portal_id}}` — user's HubSpot portal
- `{{hubspot_access_token}}` — OAuth token
- `{{user_email}}` — user's email
- `{{user_name}}` — user's name
- `{{current_date}}` — today's date

---

## Workflow 1: Renewal Health Scanner

**Type:** Workflow Agent (standalone, can also be invoked by Knowledge Agent)
**Trigger:** Manual + Scheduled (weekly)
**Price:** $10/mo

### Flow
```
Step 0: Get user preferences (risk threshold, time horizon)
Step 1: Search HubSpot deals renewing in next 12 months
Step 2: For each deal → get associated contacts
Step 3: For each deal → get recent engagements (emails, calls, meetings)
Step 4: LLM → score health (0-10), classify archetype, flag risks
Step 5: Write health scores back to HubSpot deal properties
Step 6: LLM → generate portfolio summary
Step 7: Format output → beautiful report
Step 8: Email report to user
Step 9: Save to BaseCommand via API
```

### Actions JSON

> **Copy-paste ready.** Updated 2026-03-21 v7 — Adaptive renewal setup flow.
> 8 steps: setup questions → search → LLM analyze (adapts to user's setup) → LLM format → display → email.
> Handles 4 user scenarios: separate pipeline, custom property, close date only, need help.
> "Need help" users get a Breeze AI prompt to set up renewal structure in HubSpot.

```json
[
  {
    "id": "a1000001-v7-001",
    "type": "get_user_input",
    "label": "How do you identify renewals in HubSpot?",
    "order": 0,
    "inputs": [
      {
        "name": "input_type",
        "value": "dropdown (single)",
        "type": "dropdown",
        "required": true,
        "dropdownOptions": [
          {"label": "I have a separate renewal pipeline", "value": "separate_pipeline"},
          {"label": "I use a custom property to tag renewals (e.g., deal_type = renewal)", "value": "custom_property"},
          {"label": "I use close date on all deals (no renewal-specific setup yet)", "value": "close_date_only"},
          {"label": "I'm not sure / I need help setting this up", "value": "need_help"}
        ]
      },
      {
        "name": "input_description",
        "value": "How do you currently identify renewal deals in HubSpot?",
        "type": "text",
        "required": true
      },
      {
        "name": "default_value",
        "value": "close_date_only",
        "type": "text",
        "required": false
      },
      {
        "name": "required",
        "value": true,
        "type": "checkbox",
        "required": false
      },
      {
        "name": "input_name",
        "value": "renewal_setup_type",
        "type": "text",
        "required": true
      },
      {
        "name": "show_in_agent_settings",
        "value": true,
        "type": "checkbox",
        "required": false
      },
      {
        "name": "settings_only",
        "value": false,
        "type": "checkbox",
        "required": false
      }
    ]
  },
  {
    "id": "a1000001-v7-002",
    "type": "get_user_input",
    "label": "Renewal pipeline or property details",
    "order": 1,
    "inputs": [
      {
        "name": "input_type",
        "value": "text",
        "type": "dropdown",
        "required": true
      },
      {
        "name": "input_description",
        "value": "If you selected 'separate pipeline' — what is the pipeline name? If 'custom property' — what property name and value identify renewals? (e.g., deal_type = renewal). If 'close date only' or 'need help' — just type 'skip'.",
        "type": "text",
        "required": true
      },
      {
        "name": "default_value",
        "value": "skip",
        "type": "text",
        "required": false
      },
      {
        "name": "required",
        "value": true,
        "type": "checkbox",
        "required": false
      },
      {
        "name": "input_name",
        "value": "renewal_identifier",
        "type": "text",
        "required": true
      },
      {
        "name": "show_in_agent_settings",
        "value": true,
        "type": "checkbox",
        "required": false
      },
      {
        "name": "settings_only",
        "value": false,
        "type": "checkbox",
        "required": false
      }
    ]
  },
  {
    "id": "a1000001-v7-003",
    "type": "get_user_input",
    "label": "Get analysis preferences",
    "order": 2,
    "inputs": [
      {
        "name": "input_type",
        "value": "dropdown (single)",
        "type": "dropdown",
        "required": true,
        "dropdownOptions": [
          {"label": "6 Months", "value": "6 Months"},
          {"label": "5 Months", "value": "5 Months"},
          {"label": "4 Months", "value": "4 Months"},
          {"label": "3 Months", "value": "3 Months"},
          {"label": "2 Months", "value": "2 Months"},
          {"label": "1 Month", "value": "1 Month"}
        ]
      },
      {
        "name": "input_description",
        "value": "How far ahead should I look for renewals?",
        "type": "text",
        "required": true
      },
      {
        "name": "default_value",
        "value": "6 Months",
        "type": "text",
        "required": false
      },
      {
        "name": "required",
        "value": true,
        "type": "checkbox",
        "required": false
      },
      {
        "name": "input_name",
        "value": "time_horizon",
        "type": "text",
        "required": true
      },
      {
        "name": "show_in_agent_settings",
        "value": true,
        "type": "checkbox",
        "required": false
      },
      {
        "name": "settings_only",
        "value": false,
        "type": "checkbox",
        "required": false
      }
    ]
  },
  {
    "id": "a1000001-v7-004",
    "type": "hubspot.v2.search_objects",
    "label": "Pull all deals from HubSpot",
    "order": 3,
    "inputs": [
      {
        "name": "object_type",
        "value": "deals",
        "type": "hubspot_object_type"
      },
      {
        "name": "output_variable_name",
        "value": "hs_search_results",
        "type": "text"
      }
    ]
  },
  {
    "id": "a1000001-v7-005",
    "type": "invoke_llm",
    "label": "AI: Score health and classify archetypes",
    "order": 4,
    "inputs": [
      {"name": "llm_engine", "value": "gpt4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are an expert renewal health scoring engine for B2B SaaS companies.\n\nUSE ONLY THE ACTUAL DATA BELOW — do not invent account names, ARR values, or scores.\n\nDEALS FROM HUBSPOT:\n{{ hs_search_results }}\n\nUSER'S RENEWAL SETUP:\n- Setup type: {{ renewal_setup_type }}\n- Identifier details: {{ renewal_identifier }}\n- Time horizon: {{ time_horizon }}\n- Today's date: {{ current_date }}\n\nFILTERING RULES (adapt based on user's setup type):\n\nIf setup type is 'separate_pipeline':\n- Only analyze deals where the pipeline property matches the pipeline name the user provided in renewal_identifier\n- Use closedate to determine time horizon\n\nIf setup type is 'custom_property':\n- Only analyze deals where the property/value the user described in renewal_identifier matches (e.g., if they said 'deal_type = renewal', only include deals that appear to be renewals based on dealname or stage context)\n- Use closedate to determine time horizon\n\nIf setup type is 'close_date_only':\n- Analyze ALL deals with a closedate within the time horizon from today\n- Ignore deals with no closedate, closedates in the distant past, or closedates beyond the horizon\n- Ignore deals in closedlost stage\n\nIf setup type is 'need_help':\n- Analyze ALL deals to give the user a taste of the value\n- Note in your summary: 'For more accurate results, follow the HubSpot setup guide shown below this report.'\n\nFor EACH qualifying deal, produce:\n- Health Score (0-10, one decimal): Based on deal stage, close date proximity, amount, last modified date, and any available engagement signals\n- Behavioral Archetype: Power User (8-10), Enthusiastic Adopter (7-8), Convert (5-7), Explorer (4-5), Struggler (2-4), Disconnected (0-2)\n- Risk Signals: Specific red flags from THIS deal's actual data\n- Top Action: The single most important thing to do this week\n- Days to Renewal: calculated from closedate vs today\n\nPORTFOLIO SUMMARY:\n- Total accounts analyzed, total ARR, average health score\n- Count by archetype\n- Top 3 needing immediate attention\n- Total ARR at risk (score < 5)\n\nCRITICAL: Use REAL deal names and REAL amounts from the data. Do NOT make up data.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "health_analysis", "type": "text", "required": false}
    ]
  },
  {
    "id": "a1000001-v7-006",
    "type": "invoke_llm",
    "label": "AI: Generate formatted report",
    "order": 5,
    "inputs": [
      {"name": "llm_engine", "value": "gpt4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "Generate a premium-styled HTML renewal health report from this data. Do NOT use markdown — output raw HTML only.\n\nUse this styling:\n- Font: font-family: 'Inter', -apple-system, sans-serif throughout\n- Container: max-width 720px, margin 0 auto\n- Section headers: font-size 18px, font-weight 700, color #161A25, border-bottom 2px solid #E2E5EB, padding-bottom 8px, margin-top 28px, margin-bottom 14px\n- Tables: width 100%, border-collapse collapse, font-size 13px\n- Table headers (th): background #F0F2F5, color #4A5162, font-weight 600, text-align left, padding 10px 14px, border-bottom 2px solid #E2E5EB\n- Table cells (td): padding 10px 14px, border-bottom 1px solid #F0F2F5, color #161A25\n- Score badges: display inline-block, padding 3px 10px, border-radius 6px, font-weight 600, font-size 12px\n  - Score 8+: background #ECFDF5, color #059669\n  - Score 5-7: background #FFFBEB, color #D97706\n  - Score <5: background #FEF2F2, color #DC4A3D\n- Archetype badges: same styling as scores but with background #F0F2F5, color #4A5162\n- Stat cards: display inline-block, background #FFFFFF, border 1px solid #E2E5EB, border-radius 12px, padding 18px 22px, min-width 140px, text-align center, margin 6px\n  - Stat value: font-size 28px, font-weight 700\n  - Stat label: font-size 11px, font-weight 600, color #9AA1B0, text-transform uppercase, letter-spacing 0.04em\n- Action items: numbered list, each with bold account name, then action text\n- At-risk highlight rows: background #FEF2F2\n\nSections to include:\n1. Summary stat cards row (Total Accounts, Total ARR, Avg Health, ARR at Risk)\n2. Accounts Requiring Immediate Attention (score < 5, table sorted by ARR, red highlight)\n3. Full Portfolio Scorecard (table: Account | ARR | Renewal | Score | Archetype | Top Action)\n4. Archetype Distribution (horizontal bar or count badges)\n5. Top 5 Actions by Revenue Impact (numbered list)\n\nData:\n{{ health_analysis }}\n\nOutput ONLY the HTML — no markdown, no code fences, no explanation. Start with <div> end with </div>.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "formatted_report", "type": "text", "required": false}
    ]
  },
  {
    "id": "a1000001-v7-007",
    "type": "output_formatter",
    "label": "Display health report",
    "order": 6,
    "inputs": [
      {"name": "heading", "value": "Renewal Health Report — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "<div style=\"background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-family:Inter,-apple-system,sans-serif;display:flex;align-items:center;gap:10px\"><span style=\"font-size:18px\">💡</span><p style=\"font-size:13px;color:#92400E;margin:0;line-height:1.5\"><strong>First time?</strong> Scroll below the report for a HubSpot setup guide — includes a Breeze AI prompt to create renewal-specific properties and a dedicated pipeline in seconds.</p></div>{{ formatted_report }}<div style=\"margin-top:28px;padding-top:20px;border-top:1px solid #E2E5EB;text-align:center;font-family:Inter,-apple-system,sans-serif\"><p style=\"font-size:14px;color:#4A5162;margin:0 0 12px\">Want continuous monitoring? BaseCommand runs this analysis 24/7.</p><a href=\"https://basecommand.ai/signup\" style=\"display:inline-block;padding:10px 28px;background:#059669;color:#fff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none\">Start your free 14-day Pro trial</a></div>", "type": "textarea", "required": true},
      {"name": "format", "value": "html", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a1000001-v7-008",
    "type": "output_formatter",
    "label": "Show HubSpot setup guide",
    "order": 7,
    "inputs": [
      {"name": "heading", "value": "Optimize Your HubSpot for Renewal Intelligence", "type": "text", "required": false},
      {"name": "output_formatted", "value": "<div style=\"font-family:Inter,-apple-system,sans-serif;max-width:720px;margin:0 auto\">\n<div style=\"background:#F0FDF9;border:1px solid #D1FAE5;border-radius:12px;padding:24px;margin-bottom:20px\">\n<h3 style=\"font-size:16px;font-weight:700;color:#059669;margin:0 0 8px\">Get better results with a dedicated renewal setup</h3>\n<p style=\"font-size:13px;color:#4A5162;line-height:1.6;margin:0 0 16px\">This agent works best when your HubSpot has renewal-specific properties and a dedicated pipeline. Copy the prompt below and paste it into <strong>HubSpot Breeze AI</strong> to set everything up in seconds.</p>\n<div style=\"background:#FFFFFF;border:1px solid #E2E5EB;border-radius:8px;padding:16px;margin-bottom:16px\">\n<p style=\"font-size:11px;font-weight:600;color:#9AA1B0;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 8px\">Breeze AI Prompt — copy and paste into HubSpot</p>\n<p style=\"font-size:13px;color:#161A25;line-height:1.7;margin:0;white-space:pre-wrap\">Create the following custom deal properties and group them under a new property group called \"Renewal Intelligence\":\n\n1. renewal_type (Dropdown with options: New Business, Renewal, Expansion, Contraction) — default: New Business\n2. renewal_date (Date picker) — the actual contract renewal date\n3. contract_start_date (Date picker) — when the current contract started\n4. contract_term_months (Number) — default 12\n5. arr (Number, formatted as currency) — Annual Recurring Revenue for this deal\n6. previous_arr (Number, formatted as currency) — prior contract value before this renewal\n7. renewal_owner (Single-line text) — name or email of the person managing this renewal (use a workflow to sync from deal owner if needed)\n\nAlso create a new deal pipeline called \"Renewal Pipeline\" with these stages:\n- Upcoming (20% probability)\n- Outreach Sent (40%)\n- In Discussion (60%)\n- Proposal Sent (80%)\n- Verbal Commit (90%)\n- Closed Won (100%, won)\n- Closed Lost (0%, lost)</p>\n</div>\n<p style=\"font-size:12px;color:#9AA1B0;margin:0\">After creating these, re-run this agent and select \"I have a separate renewal pipeline\" for more accurate results.</p>\n</div>\n</div>", "type": "textarea", "required": true},
      {"name": "format", "value": "html", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a1000001-v7-009",
    "type": "send_message",
    "label": "Email report to user",
    "order": 8,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Renewal Health Report — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ formatted_report }}", "type": "textarea", "required": true}
    ]
  }
]
```

> **v7b — 9 steps.** Adaptive setup flow + guaranteed Breeze AI prompt as its own step.
> Breeze prompt is a dedicated output_formatter (not LLM-dependent), always shows.
> Engagements loop, write-back, and BaseCommand save are future enhancements.

### HubSpot Custom Properties Required

Users need to create these custom deal properties in HubSpot (agent should guide them):
- `ai_health_score` (Number) — 0-10 health score
- `ai_archetype` (Single-line text) — Power User, Enthusiastic Adopter, etc.
- `ai_risk_signals` (Multi-line text) — Risk flags
- `ai_next_action` (Single-line text) — Recommended next step
- `ai_scored_date` (Date) — Last scored date

---

## Workflow 2: Renewal Forecast Engine

**Type:** Workflow Agent
**Trigger:** Manual + Scheduled (weekly)
**Price:** $10/mo

### Flow
```
Step 0: Pull all deals with amounts and close dates
Step 1: Get engagement history for context
Step 2: LLM → calculate GRR/NRR, build scenarios, identify risks
Step 3: Format as board-ready report
Step 4: Create downloadable CSV
Step 5: Email to user
Step 6: Log execution to BaseCommand
```

### Actions JSON

```json
[
  {
    "id": "a2000001-0001-0001-0001-000000000001",
    "type": "hubspot.v2.search_objects",
    "label": "Pull all deals with renewal dates",
    "order": 0,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "dealstage", "operator": "NEQ", "value": "closedlost"},
        {"propertyName": "amount", "operator": "GT", "value": "0"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "hubspot_owner_id", "hs_deal_stage_probability"], "type": "properties", "required": false},
      {"name": "associations", "value": ["contacts", "companies"], "type": "associations", "required": false},
      {"name": "output_variable_name", "value": "all_deals", "type": "text", "required": true},
      {"name": "output_sort", "value": "closedate", "type": "dropdown", "required": false},
      {"name": "output_sort_dir", "value": "ASCENDING", "type": "dropdown", "required": false},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a2000001-0001-0001-0001-000000000002",
    "type": "invoke_llm",
    "label": "AI: Build GRR/NRR forecast with scenarios",
    "order": 1,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a board-ready renewal forecasting engine. Analyze these HubSpot deals and produce a complete forecast.\n\nDEALS DATA:\n{{ all_deals }}\n\nToday: {{ current_date }}\n\nProduce:\n\n1. FORECAST SUMMARY (3-5 sentences, copy-paste ready for board email)\n- Total renewing ARR, projected GRR, projected NRR, key risk, key upside\n\n2. KEY METRICS\n- GRR = retained ARR / total renewing ARR (cannot exceed 100%)\n- NRR = (retained + expansion) / total renewing ARR\n- Churn exposure (ARR where deal stage suggests risk)\n- Show your math\n\n3. PERIOD BREAKDOWN — group by: This Month, Next Month, This Quarter, Next Quarter\nFor each period:\n- Committed (stage = Closed Won or high probability): account names + ARR\n- Probable (medium probability stages): account names + ARR\n- At Risk (early stages, no recent activity): account names + ARR\n\n4. THREE SCENARIOS with math:\n- Best Case: all probable renew + 10% expansion\n- Expected: risk-adjusted based on deal stages\n- Downside: at-risk accounts churn\n\n5. RISK CALLOUTS: accounts with specific risk signals\n\n6. TOP 5 ACTIONS ordered by revenue impact\n\nReturn as JSON:\n{\"summary\": \"\", \"grr\": 0.0, \"nrr\": 0.0, \"total_arr\": 0, \"at_risk_arr\": 0, \"periods\": [], \"scenarios\": {\"best\": {}, \"expected\": {}, \"downside\": {}}, \"risks\": [], \"actions\": []}", "type": "textarea", "required": true},
      {"name": "output_json_schema", "value": "{\"type\": \"object\", \"properties\": {\"summary\": {\"type\": \"string\"}, \"grr\": {\"type\": \"number\"}, \"nrr\": {\"type\": \"number\"}}}", "type": "json-schema", "required": false},
      {"name": "output_variable_name", "value": "forecast", "type": "text", "required": false}
    ]
  },
  {
    "id": "a2000001-0001-0001-0001-000000000003",
    "type": "invoke_llm",
    "label": "AI: Format as beautiful markdown report",
    "order": 2,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o-mini", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "Convert this forecast JSON into a beautiful markdown report suitable for a VP of Revenue to forward to their CEO.\n\nUse:\n- Bold headers and clean tables\n- GRR/NRR as large formatted numbers\n- Color emoji indicators (green_circle, yellow_circle, red_circle)\n- Period breakdown as a table\n- Scenarios side by side\n- Risk callouts with severity\n- Actions as a numbered priority list\n\nData: {{ forecast }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "formatted_forecast", "type": "text", "required": false}
    ]
  },
  {
    "id": "a2000001-0001-0001-0001-000000000004",
    "type": "create_file",
    "label": "Generate downloadable forecast CSV",
    "order": 3,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "Account,ARR,Renewal Date,Stage,Confidence,GRR Impact,Risk Signals\n{{ forecast.periods }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "forecast_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a2000001-0001-0001-0001-000000000005",
    "type": "output_formatter",
    "label": "Display forecast report",
    "order": 4,
    "inputs": [
      {"name": "heading", "value": "Renewal Forecast — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ formatted_forecast }}\n\n---\n**Download:** [Forecast CSV]({{ forecast_csv }})\n\n---\n*Want live forecasting that updates as deals move?* BaseCommand tracks week-over-week forecast movements and alerts you when deals shift risk tiers. [Start free trial](https://basecommand.ai/signup)", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a2000001-0001-0001-0001-000000000006",
    "type": "send_message",
    "label": "Email forecast to user",
    "order": 15,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Renewal Forecast — GRR {{ forecast.grr }}% | NRR {{ forecast.nrr }}% | {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ formatted_forecast }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 3: Deal Stage Timer

**Type:** Workflow Agent
**Trigger:** Manual + Scheduled (weekly)
**Price:** $10/mo
**Solves:** HubSpot Gap #3 — Pipeline duration reports (hundreds of upvotes, declined by HubSpot)

### Flow
```
Step 0: Pull all open deals
Step 1: For each deal → get timeline events (stage change history)
Step 2: LLM → calculate actual time-in-stage, flag stale deals, compute velocity
Step 3: Format as pipeline velocity report
Step 4: Create downloadable CSV of stale deals
Step 5: Display + email
```

### Actions JSON

```json
[
  {
    "id": "a3000001-0001-0001-0001-000000000001",
    "type": "hubspot.v2.search_objects",
    "label": "Pull all open deals",
    "order": 0,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "dealstage", "operator": "NEQ", "value": "closedwon"},
        {"propertyName": "dealstage", "operator": "NEQ", "value": "closedlost"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "createdate", "hs_lastmodifieddate", "hubspot_owner_id", "notes_last_updated"], "type": "properties", "required": false},
      {"name": "output_variable_name", "value": "open_deals", "type": "text", "required": true},
      {"name": "output_sort", "value": "createdate", "type": "dropdown", "required": false},
      {"name": "output_sort_dir", "value": "ASCENDING", "type": "dropdown", "required": false},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a3000001-0001-0001-0001-000000000002",
    "type": "parallel_for_condition",
    "label": "For each deal — get stage history",
    "order": 1,
    "inputs": [
      {"name": "loop_count", "value": "{{ open_deals.total }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "deal_timelines", "type": "text", "required": true},
      {"name": "variable_name", "value": "timeline_index", "type": "text", "required": true}
    ]
  },
  {
    "id": "a3000001-0001-0001-0001-000000000003",
    "type": "hubspot.v2.get_timeline_events",
    "label": "Get deal stage change history",
    "order": 2,
    "inputs": [
      {"name": "object_type", "value": "deal", "type": "dropdown", "required": true},
      {"name": "source_object_id", "value": "{{ open_deals.results[timeline_index].id }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "timeline_events", "type": "text", "required": true},
      {"name": "result_limit", "value": "50", "type": "text", "required": false}
    ]
  },
  {
    "id": "a3000001-0001-0001-0001-000000000004",
    "type": "end_condition",
    "label": "End timeline loop",
    "order": 3,
    "inputs": []
  },
  {
    "id": "a3000001-0001-0001-0001-000000000005",
    "type": "invoke_llm",
    "label": "AI: Calculate time-in-stage and flag bottlenecks",
    "order": 4,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a pipeline velocity analyst. Analyze these HubSpot deals and their stage change histories to calculate time-in-stage metrics.\n\nDEALS:\n{{ open_deals }}\n\nTIMELINE EVENTS:\n{{ deal_timelines }}\n\nToday: {{ current_date }}\n\nProduce:\n\n1. DEAL-LEVEL ANALYSIS — for each deal:\n- Deal name, ARR, current stage\n- Days in current stage (from last stage change event to today)\n- Total deal age (from create date)\n- Status: ON_TRACK (<30 days in stage), SLOW (30-60 days), STALE (60+ days), CRITICAL (90+ days)\n- Days since last activity (from hs_lastmodifieddate)\n\n2. STAGE BOTTLENECK MAP:\n- Average days per stage across all deals\n- Which stage has longest average duration\n- Which stage has most deals stacked\n- Conversion rate between stages if calculable\n\n3. STALE DEAL ALERTS (sorted by ARR, highest first):\n- Deals in same stage 30+ days\n- Deals with no activity in 14+ days\n- For each: name, ARR, stage, days stuck, recommended action\n\n4. PIPELINE VELOCITY:\n- Average deal cycle: create → current days\n- Pipeline velocity = (count × avg value × est win rate) / avg cycle\n- Estimated close dates based on average velocity\n\n5. RECOMMENDED ACTIONS:\n- KILL list: close-lost these stale deals (90+ days, no engagement)\n- PUSH list: accelerate these (high value, stuck in late stage)\n- NURTURE list: slow-play these (early stage, needs qualification)\n\nReturn as structured JSON.", "type": "textarea", "required": true},
      {"name": "output_json_schema", "value": "{\"type\": \"object\", \"properties\": {\"deals\": {\"type\": \"array\"}, \"bottlenecks\": {\"type\": \"object\"}, \"stale_alerts\": {\"type\": \"array\"}, \"velocity\": {\"type\": \"object\"}, \"actions\": {\"type\": \"object\"}}}", "type": "json-schema", "required": false},
      {"name": "output_variable_name", "value": "velocity_analysis", "type": "text", "required": false}
    ]
  },
  {
    "id": "a3000001-0001-0001-0001-000000000006",
    "type": "invoke_llm",
    "label": "AI: Format velocity report",
    "order": 15,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o-mini", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "Convert this pipeline velocity analysis into a clean markdown report for a sales manager.\n\nUse tables, color indicators (red_circle for STALE/CRITICAL, yellow_circle for SLOW, green_circle for ON_TRACK).\n\nSections:\n1. Pipeline Health Dashboard (total deals, avg velocity, stale count, biggest bottleneck)\n2. Stale Deal Alerts (table, sorted by ARR)\n3. Stage Bottleneck Map (visual-friendly)\n4. Kill / Push / Nurture recommendations\n5. Full deal velocity table\n\nData: {{ velocity_analysis }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "velocity_report", "type": "text", "required": false}
    ]
  },
  {
    "id": "a3000001-0001-0001-0001-000000000007",
    "type": "create_file",
    "label": "Generate stale deals CSV",
    "order": 15,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "Deal,ARR,Stage,Days in Stage,Last Activity,Status,Action\n{{ velocity_analysis.stale_alerts }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "stale_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a3000001-0001-0001-0001-000000000008",
    "type": "output_formatter",
    "label": "Display velocity report",
    "order": 15,
    "inputs": [
      {"name": "heading", "value": "Pipeline Velocity Report — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ velocity_report }}\n\n---\n**Download:** [Stale Deals CSV]({{ stale_csv }})\n\n---\n*This is the pipeline duration report that HubSpot won't build.* Want it automated weekly? BaseCommand monitors deal movement daily and alerts you when deals go stale. [Start free trial](https://basecommand.ai/signup)", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a3000001-0001-0001-0001-000000000009",
    "type": "send_message",
    "label": "Email velocity report",
    "order": 15,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Pipeline Velocity Report — {{ velocity_analysis.stale_alerts.length }} stale deals flagged | {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ velocity_report }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 4: HubSpot Data Cleaner

**Type:** Workflow Agent
**Trigger:** Manual + Scheduled (monthly)
**Price:** $10/mo

### Flow
```
Step 0: Ask which object to clean (contacts, companies, deals)
Step 1: Pull all objects of that type
Step 2: LLM → identify duplicates, data quality issues, missing fields
Step 3: Format as data quality report with merge plan
Step 4: Create downloadable cleanup CSV
Step 5: Display + email
```

### Actions JSON

```json
[
  {
    "id": "a4000001-0001-0001-0001-000000000001",
    "type": "get_user_input",
    "label": "What do you want to clean?",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "dropdown", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "Which HubSpot object should I audit?", "type": "text", "required": true},
      {"name": "default_value", "value": "contacts", "type": "text", "required": false},
      {"name": "dropdown_options", "value": "contacts\ncompanies\ndeals", "type": "textarea", "required": true},
      {"name": "input_name", "value": "object_to_clean", "type": "text", "required": true}
    ]
  },
  {
    "id": "a4000001-0001-0001-0001-000000000002",
    "type": "hubspot.v2.search_objects",
    "label": "Pull all records from HubSpot",
    "order": 1,
    "inputs": [
      {"name": "object_type", "value": "{{ object_to_clean }}", "type": "dropdown", "required": true},
      {"name": "properties", "value": ["firstname", "lastname", "email", "company", "phone", "jobtitle", "createdate", "lastmodifieddate", "hs_lead_status", "lifecyclestage", "associatedcompanyid"], "type": "properties", "required": false},
      {"name": "output_variable_name", "value": "all_records", "type": "text", "required": true},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a4000001-0001-0001-0001-000000000003",
    "type": "invoke_llm",
    "label": "AI: Analyze data quality and find duplicates",
    "order": 2,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a CRM data quality analyst. Analyze these HubSpot records and identify every data quality issue.\n\nRECORDS:\n{{ all_records }}\n\nProduce:\n\n1. DUPLICATE GROUPS — find duplicates by:\n- Exact email match\n- Fuzzy name match (Acme Corp = Acme Corporation = ACME)\n- Same phone, different name\nFor each group: list records, identify the winner (most complete), mark losers for merge\n\n2. DATA QUALITY ISSUES:\n- Missing critical fields (contacts without email, without company)\n- Invalid formats (bad emails, inconsistent phone formats)\n- Stale records (no activity 12+ months)\n- ALL CAPS names, inconsistent casing\n- Junk/test records (test@, spam patterns)\n- Orphaned records (no company association)\n\n3. STANDARDIZATION FIXES:\n- Company name normalization (Inc/LLC/Ltd variations)\n- Phone format standardization\n- Email lowercase\n- Name proper casing\n\n4. SUMMARY STATS:\n- Total records, duplicate groups, issues found\n- Data quality score (A/B/C/D/F)\n- Estimated hours saved by automated cleanup\n\nReturn as JSON:\n{\"duplicates\": [{\"group\": [], \"winner\": \"\", \"losers\": []}], \"issues\": [{\"record\": \"\", \"issue\": \"\", \"severity\": \"\", \"fix\": \"\"}], \"standardizations\": [], \"summary\": {}}", "type": "textarea", "required": true},
      {"name": "output_json_schema", "value": "{\"type\": \"object\", \"properties\": {\"duplicates\": {\"type\": \"array\"}, \"issues\": {\"type\": \"array\"}, \"summary\": {\"type\": \"object\"}}}", "type": "json-schema", "required": false},
      {"name": "output_variable_name", "value": "quality_analysis", "type": "text", "required": false}
    ]
  },
  {
    "id": "a4000001-0001-0001-0001-000000000004",
    "type": "invoke_llm",
    "label": "AI: Format data quality report",
    "order": 3,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o-mini", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "Format this data quality analysis as a clean markdown report.\n\nSections:\n1. Data Quality Score (letter grade with explanation)\n2. Duplicate Groups (table: group #, records, winner, action)\n3. Critical Issues (table: record, issue, severity, fix)\n4. Standardization Fixes (list)\n5. Cleanup Priority (what to fix first, in order)\n6. How to Apply in HubSpot (step-by-step instructions for merging and fixing)\n\nUse severity indicators: red_circle Critical, yellow_circle Warning, blue_circle Info\n\nData: {{ quality_analysis }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "quality_report", "type": "text", "required": false}
    ]
  },
  {
    "id": "a4000001-0001-0001-0001-000000000005",
    "type": "create_file",
    "label": "Generate cleanup CSV",
    "order": 4,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "Record,Email,Issue,Severity,Recommended Fix,Duplicate Group\n{{ quality_analysis.issues }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "cleanup_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a4000001-0001-0001-0001-000000000006",
    "type": "output_formatter",
    "label": "Display data quality report",
    "order": 15,
    "inputs": [
      {"name": "heading", "value": "HubSpot Data Quality Report — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ quality_report }}\n\n---\n**Download:** [Cleanup Plan CSV]({{ cleanup_csv }})\n\n---\n*HubSpot only lets you merge duplicates one at a time.* This report gives you the priority order so you spend your time on the merges that matter most.\n\n[Try our CRM Data Parser](https://agent.ai/agent/basecommand-crm-parser) to clean and structure messy data before importing.", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a4000001-0001-0001-0001-000000000007",
    "type": "send_message",
    "label": "Email data quality report",
    "order": 15,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "HubSpot Data Quality: Grade {{ quality_analysis.summary.grade }} | {{ quality_analysis.summary.duplicate_count }} duplicates found | {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ quality_report }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Notes for Agent.ai Builder

### HubSpot Custom Properties
The Health Scanner writes back to HubSpot. Users need to create these custom deal properties first:
- `ai_health_score` (Number)
- `ai_archetype` (Single-line text)
- `ai_risk_signals` (Multi-line text)
- `ai_next_action` (Single-line text)
- `ai_scored_date` (Date)

Consider adding a "Setup Helper" workflow that creates these properties automatically via the HubSpot API.

### Scheduling
All 4 workflow agents should support scheduled triggers:
- Health Scanner → Weekly (Monday morning)
- Forecast Engine → Weekly (Friday afternoon)
- Deal Stage Timer → Weekly (Wednesday)
- Data Cleaner → Monthly (1st of month)

### Secrets Required
- `basecommand_api_key` — for saving to BaseCommand (optional, only if user has BaseCommand account)

### LLM Model Selection
- Primary analysis: `gpt-4o` (accuracy matters)
- Report formatting: `gpt-4o-mini` (speed, lower cost)
- Consider offering Claude Sonnet as alternative for premium feel

### Error Handling
Each workflow should handle:
- No HubSpot connection → guide user to connect
- No deals found → explain why and suggest fixes
- API rate limits → retry with backoff
- Missing properties → skip gracefully, note in report
