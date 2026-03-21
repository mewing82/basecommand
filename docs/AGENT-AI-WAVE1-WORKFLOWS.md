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

```json
[
  {
    "id": "a1000001-0001-0001-0001-000000000001",
    "type": "get_user_input",
    "label": "Get analysis preferences",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "dropdown", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "How far ahead should I look for renewals?", "type": "text", "required": true},
      {"name": "default_value", "value": "6 months", "type": "text", "required": false},
      {"name": "dropdown_options", "value": "3 months\n6 months\n12 months", "type": "textarea", "required": true},
      {"name": "input_name", "value": "time_horizon", "type": "text", "required": true},
      {"name": "show_in_agent_settings", "value": true, "type": "checkbox", "required": false}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000002",
    "type": "hubspot.v2.search_objects",
    "label": "Pull all renewing deals from HubSpot",
    "order": 1,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "dealstage", "operator": "NEQ", "value": "closedlost"},
        {"propertyName": "closedate", "operator": "GTE", "value": "{{ current_date }}"},
        {"propertyName": "closedate", "operator": "LTE", "value": "+365d"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "hubspot_owner_id", "notes_last_updated", "num_associated_contacts"], "type": "properties", "required": false},
      {"name": "associations", "value": ["contacts", "companies"], "type": "associations", "required": false},
      {"name": "output_variable_name", "value": "renewal_deals", "type": "text", "required": true},
      {"name": "output_sort", "value": "closedate", "type": "dropdown", "required": false},
      {"name": "output_sort_dir", "value": "ASCENDING", "type": "dropdown", "required": false},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000003",
    "type": "set_variable",
    "label": "Count deals found",
    "order": 2,
    "inputs": [
      {"name": "variable_name", "value": "deal_count", "type": "text", "required": true},
      {"name": "variable_value", "value": "{{ renewal_deals.total }}", "type": "textarea", "required": true}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000004",
    "type": "if_condition",
    "label": "Check if deals were found",
    "order": 3,
    "inputs": [
      {"name": "query", "value": "{{ deal_count }} > 0", "type": "textarea", "required": false}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000005",
    "type": "parallel_for_condition",
    "label": "For each deal — pull engagement data",
    "order": 4,
    "inputs": [
      {"name": "loop_count", "value": "{{ deal_count }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "deal_engagements", "type": "text", "required": true},
      {"name": "variable_name", "value": "deal_index", "type": "text", "required": true}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000006",
    "type": "hubspot.v2.get_engagements",
    "label": "Get recent engagements for deal",
    "order": 5,
    "inputs": [
      {"name": "object_type", "value": "deal", "type": "dropdown", "required": true},
      {"name": "source_object_id", "value": "{{ renewal_deals.results[deal_index].id }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "engagements", "type": "text", "required": true},
      {"name": "result_limit", "value": "10", "type": "text", "required": false}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000007",
    "type": "end_condition",
    "label": "End deal engagement loop",
    "order": 6,
    "inputs": []
  },
  {
    "id": "a1000001-0001-0001-0001-000000000008",
    "type": "invoke_llm",
    "label": "AI: Score health and classify archetypes",
    "order": 7,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are an expert renewal health scoring engine. Analyze these HubSpot deals and their engagement data.\n\nDEALS:\n{{ renewal_deals }}\n\nENGAGEMENT DATA:\n{{ deal_engagements }}\n\nToday's date: {{ current_date }}\n\nFor EACH deal, produce:\n1. Health Score (0-10, one decimal): Weight usage signals 25%, engagement recency 20%, stakeholder stability 20%, commercial signals 15%, support health 10%, competitive risk 10%.\n2. Behavioral Archetype: Power User (8-10), Enthusiastic Adopter (7-8), Convert (5-7), Explorer (4-5), Struggler (2-4), Disconnected (0-2)\n3. Risk Signals: Specific red flags from the data (not generic)\n4. Top Action: The single most important thing to do for this account this week\n5. Days to Renewal: calculated from closedate\n\nAlso produce PORTFOLIO SUMMARY:\n- Total accounts, total ARR, average health score\n- Count by archetype\n- Top 3 accounts needing immediate attention\n- Total ARR at risk (score < 5)\n\nReturn as JSON with this structure:\n{\"accounts\": [{\"deal_id\": \"\", \"name\": \"\", \"arr\": 0, \"renewal_date\": \"\", \"health_score\": 0.0, \"archetype\": \"\", \"risk_signals\": [], \"top_action\": \"\", \"days_to_renewal\": 0}], \"summary\": {\"total_accounts\": 0, \"total_arr\": 0, \"avg_health\": 0.0, \"at_risk_arr\": 0, \"immediate_attention\": []}}", "type": "textarea", "required": true},
      {"name": "output_json_schema", "value": "{\"type\": \"object\", \"properties\": {\"accounts\": {\"type\": \"array\"}, \"summary\": {\"type\": \"object\"}}}", "type": "json-schema", "required": false},
      {"name": "output_variable_name", "value": "health_analysis", "type": "text", "required": false}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000009",
    "type": "parallel_for_condition",
    "label": "Write health scores back to HubSpot",
    "order": 8,
    "inputs": [
      {"name": "loop_count", "value": "{{ deal_count }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "update_results", "type": "text", "required": true},
      {"name": "variable_name", "value": "update_index", "type": "text", "required": true}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000010",
    "type": "hubspot.v2.update_object",
    "label": "Update deal with AI health score",
    "order": 9,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "hubspot_object_type", "required": true},
      {"name": "identification_method", "value": "HubSpot ID", "type": "dropdown", "required": true},
      {"name": "identifier_value", "value": "{{ health_analysis.accounts[update_index].deal_id }}", "type": "text", "required": true},
      {"name": "properties", "value": [
        {"property": "ai_health_score", "value": "{{ health_analysis.accounts[update_index].health_score }}"},
        {"property": "ai_archetype", "value": "{{ health_analysis.accounts[update_index].archetype }}"},
        {"property": "ai_risk_signals", "value": "{{ health_analysis.accounts[update_index].risk_signals }}"},
        {"property": "ai_next_action", "value": "{{ health_analysis.accounts[update_index].top_action }}"},
        {"property": "ai_scored_date", "value": "{{ current_date }}"}
      ], "type": "properties", "required": true},
      {"name": "output_variable_name", "value": "updated_deal", "type": "text", "required": true}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000011",
    "type": "end_condition",
    "label": "End write-back loop",
    "order": 10,
    "inputs": []
  },
  {
    "id": "a1000001-0001-0001-0001-000000000012",
    "type": "invoke_llm",
    "label": "AI: Generate formatted report",
    "order": 11,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "Generate a beautiful markdown renewal health report from this analysis data. Use tables, headers, and color indicators (emoji: green_circle for 8+, yellow_circle for 5-7, red_circle for <5).\n\nInclude sections:\n1. Portfolio Health Dashboard (summary stats)\n2. Accounts Requiring Immediate Attention (score < 5, sorted by ARR)\n3. Full Portfolio Scorecard (table: Account | ARR | Renewal | Score | Archetype | Top Action)\n4. Archetype Distribution\n5. Week Ahead: Top 5 actions ranked by revenue impact\n\nData:\n{{ health_analysis }}\n\nMake it scannable in 60 seconds. A VP should be able to forward this email to their CEO.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "formatted_report", "type": "text", "required": false}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000013",
    "type": "output_formatter",
    "label": "Display health report",
    "order": 12,
    "inputs": [
      {"name": "heading", "value": "Renewal Health Report — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ formatted_report }}\n\n---\n*Health scores have been written back to your HubSpot deals as custom properties (ai_health_score, ai_archetype, ai_risk_signals, ai_next_action). You can now filter and sort deals by AI health score in HubSpot.*\n\n---\n**Want continuous monitoring?** BaseCommand runs this analysis 24/7, tracks trends over time, and generates actions automatically. [Start your free 14-day Pro trial](https://basecommand.ai/signup)", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000014",
    "type": "send_message",
    "label": "Email report to user",
    "order": 13,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Renewal Health Report — {{ current_date }} | {{ health_analysis.summary.total_accounts }} accounts, {{ health_analysis.summary.at_risk_arr }} at risk", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ formatted_report }}", "type": "textarea", "required": true}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000015",
    "type": "rest_call",
    "label": "Save portfolio to BaseCommand",
    "order": 14,
    "inputs": [
      {"name": "url", "value": "https://basecommand.ai/api/import/external", "type": "text", "required": true},
      {"name": "method", "value": "POST", "type": "dropdown", "required": true},
      {"name": "format", "value": "JSON", "type": "dropdown", "required": true},
      {"name": "headers", "value": "Authorization: Bearer {{ secrets.basecommand_api_key }}\nContent-Type: application/json", "type": "text", "required": false},
      {"name": "body", "value": "{\"accounts\": {{ health_analysis.accounts }}}", "type": "text", "required": false},
      {"name": "output_variable_name", "value": "bc_save_result", "type": "text", "required": true}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000016",
    "type": "end_condition",
    "label": "End if deals found",
    "order": 15,
    "inputs": []
  },
  {
    "id": "a1000001-0001-0001-0001-000000000017",
    "type": "if_condition",
    "label": "No deals found — show guidance",
    "order": 16,
    "inputs": [
      {"name": "query", "value": "{{ deal_count }} == 0", "type": "textarea", "required": false}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000018",
    "type": "output_formatter",
    "label": "Show no-deals message",
    "order": 17,
    "inputs": [
      {"name": "heading", "value": "No Renewal Deals Found", "type": "text", "required": false},
      {"name": "output_formatted", "value": "I connected to your HubSpot portal but didn't find any open deals with future close dates.\n\n**Possible reasons:**\n- Your deals might use a custom pipeline — check your pipeline names\n- Close dates might not be set on your deals\n- You might be using a different object for renewals\n\n**Next steps:**\n1. Make sure your renewal deals have close dates set to future dates\n2. Check that deals aren't in 'Closed Lost' status\n3. Try our [CRM Data Parser](https://agent.ai/agent/basecommand-crm-parser) to import data manually", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a1000001-0001-0001-0001-000000000019",
    "type": "end_condition",
    "label": "End no-deals check",
    "order": 18,
    "inputs": []
  }
]
```

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
    "order": 5,
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
    "order": 5,
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
    "order": 6,
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
    "order": 7,
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
    "order": 8,
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
    "order": 5,
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
    "order": 6,
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
