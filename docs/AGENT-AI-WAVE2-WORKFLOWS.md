# Agent.ai Wave 2 — Workflow Agent Specs (Week 2-3)

**Last updated:** 2026-03-20
**Reference:** `docs/LLM.txt` (Agent.AI Actions Generator)
**Depends on:** Wave 1 agents live + HubSpot OAuth working

---

## Wave 2 Overview

| # | Agent | Type | Price | Status |
|---|-------|------|-------|--------|
| 1 | **Win/Loss Analyzer** | Workflow (new) | $10/mo | New — zero competition |
| 2 | **Renewal Meeting Prep** | Workflow (new) | $10/mo | New — differentiate from agent.ai's sales-focused version |
| 3 | **Duplicate Merger** | Workflow (new) | $10/mo | New — HubSpot Gap #2 (513 upvotes) |
| 4 | **Exec Brief Generator** | Workflow (upgrade) | $10/mo | Upgrade existing Knowledge Agent → premium Workflow |
| 5 | **Forecast Intelligence** | Workflow (upgrade) | $10/mo | Upgrade existing Knowledge Agent → premium Workflow with delta tracking |

---

## Workflow 5: Win/Loss Analyzer

**Type:** Workflow Agent
**Trigger:** Manual + Scheduled (monthly)
**Price:** $10/mo
**Competition:** Zero on agent.ai

### Why This Sells

Every sales leader does win/loss analysis manually in spreadsheets. This agent pulls all closed deals from HubSpot, separates won vs lost, and identifies patterns — common win themes, loss reasons, pricing insights, competitor mentions, deal cycle differences. It's the quarterly business review in one click.

### Flow
```
Step 0: Ask time period (this quarter, last quarter, last 6 months, last year)
Step 1: Pull all closed-won deals in period
Step 2: Pull all closed-lost deals in period
Step 3: For each lost deal → get engagements (find loss reasons in notes/emails)
Step 4: For each won deal → get engagements (find win themes)
Step 5: LLM → pattern analysis (win themes, loss reasons, pricing, competitors, cycle times)
Step 6: Format as executive win/loss report
Step 7: Create downloadable CSV
Step 8: Email report
```

### Actions JSON

```json
[
  {
    "id": "a5000001-0001-0001-0001-000000000001",
    "type": "get_user_input",
    "label": "Select time period",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "dropdown", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "What time period should I analyze?", "type": "text", "required": true},
      {"name": "default_value", "value": "last_quarter", "type": "text", "required": false},
      {"name": "input_name", "value": "time_period", "type": "text", "required": true},
      {"name": "show_in_agent_settings", "value": true, "type": "checkbox", "required": false}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000002",
    "type": "hubspot.v2.search_objects",
    "label": "Pull closed-won deals",
    "order": 1,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "dealstage", "operator": "EQ", "value": "closedwon"},
        {"propertyName": "closedate", "operator": "GTE", "value": "-180d"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "createdate", "hubspot_owner_id", "hs_deal_stage_probability", "deal_currency_code"], "type": "properties", "required": false},
      {"name": "associations", "value": ["contacts", "companies"], "type": "associations", "required": false},
      {"name": "output_variable_name", "value": "won_deals", "type": "text", "required": true},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000003",
    "type": "hubspot.v2.search_objects",
    "label": "Pull closed-lost deals",
    "order": 2,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "dealstage", "operator": "EQ", "value": "closedlost"},
        {"propertyName": "closedate", "operator": "GTE", "value": "-180d"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "createdate", "hubspot_owner_id", "closed_lost_reason", "deal_currency_code"], "type": "properties", "required": false},
      {"name": "associations", "value": ["contacts", "companies"], "type": "associations", "required": false},
      {"name": "output_variable_name", "value": "lost_deals", "type": "text", "required": true},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000004",
    "type": "parallel_for_condition",
    "label": "Get engagement history for lost deals",
    "order": 3,
    "inputs": [
      {"name": "loop_count", "value": "{{ lost_deals.total }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "lost_engagements", "type": "text", "required": true},
      {"name": "variable_name", "value": "lost_index", "type": "text", "required": true}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000005",
    "type": "hubspot.v2.get_engagements",
    "label": "Get notes/emails for lost deal",
    "order": 4,
    "inputs": [
      {"name": "object_type", "value": "deal", "type": "dropdown", "required": true},
      {"name": "source_object_id", "value": "{{ lost_deals.results[lost_index].id }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "lost_deal_notes", "type": "text", "required": true},
      {"name": "result_limit", "value": "5", "type": "text", "required": false}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000006",
    "type": "end_condition",
    "label": "End lost deals engagement loop",
    "order": 5,
    "inputs": []
  },
  {
    "id": "a5000001-0001-0001-0001-000000000007",
    "type": "parallel_for_condition",
    "label": "Get engagement history for won deals",
    "order": 6,
    "inputs": [
      {"name": "loop_count", "value": "{{ won_deals.total }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "won_engagements", "type": "text", "required": true},
      {"name": "variable_name", "value": "won_index", "type": "text", "required": true}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000008",
    "type": "hubspot.v2.get_engagements",
    "label": "Get notes/emails for won deal",
    "order": 7,
    "inputs": [
      {"name": "object_type", "value": "deal", "type": "dropdown", "required": true},
      {"name": "source_object_id", "value": "{{ won_deals.results[won_index].id }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "won_deal_notes", "type": "text", "required": true},
      {"name": "result_limit", "value": "5", "type": "text", "required": false}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000009",
    "type": "end_condition",
    "label": "End won deals engagement loop",
    "order": 8,
    "inputs": []
  },
  {
    "id": "a5000001-0001-0001-0001-000000000010",
    "type": "invoke_llm",
    "label": "AI: Analyze win/loss patterns",
    "order": 9,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a sales analytics expert performing a comprehensive win/loss analysis.\n\nWON DEALS:\n{{ won_deals }}\n\nWON DEAL ENGAGEMENTS:\n{{ won_engagements }}\n\nLOST DEALS:\n{{ lost_deals }}\n\nLOST DEAL ENGAGEMENTS:\n{{ lost_engagements }}\n\nAnalyze and produce:\n\n1. WIN/LOSS SUMMARY\n- Win rate: won / (won + lost)\n- Total won ARR vs total lost ARR\n- Average deal size: won vs lost\n- Average deal cycle: won vs lost (create to close)\n\n2. WIN THEMES (top 5 patterns from won deals)\n- What do winning deals have in common?\n- Contact role patterns (who was involved?)\n- Deal size sweet spots\n- Pipeline velocity patterns\n- Engagement patterns (how many touchpoints?)\n\n3. LOSS REASONS (top 5 patterns from lost deals)\n- Extract from closed_lost_reason field AND engagement notes\n- Pricing objections, competitor wins, timing, champion loss, no decision\n- At what stage do most deals die?\n- Average time before going lost\n\n4. PRICING INSIGHTS\n- Average winning deal size vs losing\n- Is there a price ceiling where win rate drops?\n- Discount patterns in wins vs losses\n\n5. COMPETITIVE INTELLIGENCE\n- Competitors mentioned in lost deal notes\n- Win rate by competitor\n- What competitors win on (price? features? relationships?)\n\n6. DEAL CYCLE ANALYSIS\n- Average cycle: won vs lost\n- Stage-by-stage timing differences\n- Deals that close faster — what's different?\n\n7. REP PERFORMANCE\n- Win rate by deal owner (if multiple reps)\n- Who closes fastest? Largest? Most consistently?\n\n8. TOP 5 ACTIONABLE RECOMMENDATIONS\n- Specific changes to improve win rate based on the data\n\nReturn as structured JSON.", "type": "textarea", "required": true},
      {"name": "output_json_schema", "value": "{\"type\": \"object\", \"properties\": {\"summary\": {\"type\": \"object\"}, \"win_themes\": {\"type\": \"array\"}, \"loss_reasons\": {\"type\": \"array\"}, \"pricing\": {\"type\": \"object\"}, \"competitors\": {\"type\": \"array\"}, \"cycle\": {\"type\": \"object\"}, \"reps\": {\"type\": \"array\"}, \"recommendations\": {\"type\": \"array\"}}}", "type": "json-schema", "required": false},
      {"name": "output_variable_name", "value": "winloss_analysis", "type": "text", "required": false}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000011",
    "type": "invoke_llm",
    "label": "AI: Format win/loss report",
    "order": 10,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o-mini", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "Convert this win/loss analysis into a polished markdown report for a VP of Sales.\n\nSections with clear headers, tables, and visual indicators:\n1. Scoreboard (win rate, ARR won/lost, avg deal size, avg cycle)\n2. Why We Win (top themes with evidence)\n3. Why We Lose (top reasons with evidence)\n4. Pricing Insights (sweet spots, ceilings)\n5. Competitive Landscape (who we lose to, why)\n6. Deal Cycle Breakdown (speed comparison)\n7. Rep Leaderboard (if multiple reps)\n8. Action Plan (top 5 recommendations, numbered, specific)\n\nUse emoji indicators: trophy for wins, x for losses, chart_with_upwards_trend for trends.\nMake it presentable in a sales team all-hands meeting.\n\nData: {{ winloss_analysis }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "winloss_report", "type": "text", "required": false}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000012",
    "type": "create_file",
    "label": "Generate win/loss CSV",
    "order": 11,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "Deal,Outcome,ARR,Close Date,Cycle Days,Loss Reason,Competitor,Owner\n{{ winloss_analysis }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "winloss_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000013",
    "type": "output_formatter",
    "label": "Display win/loss report",
    "order": 12,
    "inputs": [
      {"name": "heading", "value": "Win/Loss Analysis — {{ time_period }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ winloss_report }}\n\n---\n**Download:** [Full Win/Loss Data (CSV)]({{ winloss_csv }})\n\n---\n*Run this monthly to track if your win rate is improving.* BaseCommand automates this analysis and tracks trends over time. [Start free trial](https://basecommand.ai/signup)", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a5000001-0001-0001-0001-000000000014",
    "type": "send_message",
    "label": "Email win/loss report",
    "order": 13,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Win/Loss Analysis: {{ winloss_analysis.summary.win_rate }}% win rate | {{ won_deals.total }} won, {{ lost_deals.total }} lost | {{ time_period }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ winloss_report }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 6: Renewal Meeting Prep

**Type:** Workflow Agent
**Trigger:** Manual (before a meeting)
**Price:** $10/mo
**Competition:** agent.ai has Meeting Prep ($10/mo) but it's sales/new-business focused. Ours is renewal-context-aware.

### Differentiation from agent.ai's Meeting Prep

| Feature | agent.ai Meeting Prep | BaseCommand Renewal Meeting Prep |
|---------|----------------------|--------------------------------|
| Focus | New business / first meetings | Existing customer renewals |
| Data source | Web research, LinkedIn | HubSpot deal + engagement history |
| Context | Company info, attendees | Contract value, health score, usage trends, risk signals |
| Output | Generic prep brief | Renewal-specific: retention strategy, pricing approach, expansion opportunities, objection handling |
| Talking points | Discovery questions | Renewal defense + upsell angles based on account archetype |

### Flow
```
Step 0: Ask which account/deal to prep for
Step 1: Look up deal in HubSpot
Step 2: Get associated contacts (who's in the meeting)
Step 3: Get engagement history (emails, calls, meetings, notes)
Step 4: Get timeline events (deal stage changes)
Step 5: Get associated company details
Step 6: LLM → generate renewal meeting prep brief
Step 7: Format as actionable prep document
Step 8: Email to user
```

### Actions JSON

```json
[
  {
    "id": "a6000001-0001-0001-0001-000000000001",
    "type": "get_user_input",
    "label": "Which account are you meeting with?",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "text", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "Enter the company or deal name for your upcoming renewal meeting", "type": "text", "required": true},
      {"name": "input_name", "value": "account_name", "type": "text", "required": true},
      {"name": "required", "value": true, "type": "checkbox", "required": false}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000002",
    "type": "hubspot.v2.search_objects",
    "label": "Find the deal in HubSpot",
    "order": 1,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "dealname", "operator": "CONTAINS_TOKEN", "value": "{{ account_name }}"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "createdate", "hubspot_owner_id", "hs_deal_stage_probability", "notes_last_updated", "ai_health_score", "ai_archetype", "ai_risk_signals"], "type": "properties", "required": false},
      {"name": "associations", "value": ["contacts", "companies"], "type": "associations", "required": false},
      {"name": "output_variable_name", "value": "deal_results", "type": "text", "required": true},
      {"name": "output_limit", "value": "5", "type": "text", "required": false}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000003",
    "type": "set_variable",
    "label": "Select the primary deal",
    "order": 2,
    "inputs": [
      {"name": "variable_name", "value": "deal", "type": "text", "required": true},
      {"name": "variable_value", "value": "{{ deal_results.results[0] }}", "type": "textarea", "required": true}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000004",
    "type": "hubspot.v2.get_engagements",
    "label": "Get all engagement history for this deal",
    "order": 3,
    "inputs": [
      {"name": "object_type", "value": "deal", "type": "dropdown", "required": true},
      {"name": "source_object_id", "value": "{{ deal.id }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "deal_engagements", "type": "text", "required": true},
      {"name": "result_limit", "value": "30", "type": "text", "required": false}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000005",
    "type": "hubspot.v2.get_timeline_events",
    "label": "Get deal stage history",
    "order": 4,
    "inputs": [
      {"name": "object_type", "value": "deal", "type": "dropdown", "required": true},
      {"name": "source_object_id", "value": "{{ deal.id }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "deal_timeline", "type": "text", "required": true},
      {"name": "result_limit", "value": "20", "type": "text", "required": false}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000006",
    "type": "hubspot.v2.lookup_object",
    "label": "Get company details",
    "order": 5,
    "inputs": [
      {"name": "object_type", "value": "companies", "type": "hubspot_object_type", "required": true},
      {"name": "object_id", "value": "{{ deal.associations.companies[0].id }}", "type": "text", "required": true},
      {"name": "properties", "value": ["name", "domain", "industry", "numberofemployees", "annualrevenue", "city", "state", "country", "description"], "type": "properties", "required": false},
      {"name": "output_variable_name", "value": "company", "type": "text", "required": true}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000007",
    "type": "grab_web_text",
    "label": "Research company website for recent news",
    "order": 6,
    "inputs": [
      {"name": "url", "value": "{{ company.properties.domain }}", "type": "text", "required": true},
      {"name": "mode", "value": "scrape", "type": "dropdown", "required": false},
      {"name": "output_variable_name", "value": "company_website", "type": "text", "required": true}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000008",
    "type": "get_google_news",
    "label": "Get recent news about the company",
    "order": 7,
    "inputs": [
      {"name": "query", "value": "{{ company.properties.name }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "company_news", "type": "text", "required": true}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000009",
    "type": "invoke_llm",
    "label": "AI: Generate renewal meeting prep brief",
    "order": 8,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are an expert renewal strategist preparing a meeting brief. This is NOT a sales discovery call — this is an existing customer renewal meeting. Frame everything through the lens of retention, expansion, and deepening the relationship.\n\nDEAL:\n{{ deal }}\n\nCOMPANY:\n{{ company }}\n\nENGAGEMENT HISTORY (emails, calls, meetings, notes):\n{{ deal_engagements }}\n\nDEAL STAGE HISTORY:\n{{ deal_timeline }}\n\nCOMPANY WEBSITE:\n{{ company_website }}\n\nRECENT NEWS:\n{{ company_news }}\n\nToday: {{ current_date }}\n\nGenerate a RENEWAL MEETING PREP BRIEF with these sections:\n\n1. 60-SECOND SUMMARY\n- Account name, ARR, renewal date, days until renewal\n- Health score and archetype (if available from ai_health_score)\n- One-sentence status: \"This is a [safe/at-risk/expansion-ready] renewal because...\"\n\n2. RELATIONSHIP MAP\n- All contacts associated with this deal\n- Their roles, last interaction dates\n- Who is your champion? Who is the economic buyer?\n- Relationship gaps: who haven't you talked to recently?\n\n3. ENGAGEMENT TIMELINE\n- Key interactions over last 90 days\n- Sentiment trend: improving, stable, or declining?\n- Red flags from emails/notes (complaints, competitor mentions, escalations)\n- Green flags (expansion interest, positive feedback, referrals)\n\n4. RENEWAL STRATEGY\n- Based on the account's archetype, what's the right play?\n  - Power User → Expansion conversation, multi-year lock-in\n  - Enthusiastic Adopter → Deepen adoption, nurture\n  - Convert → Targeted upsell on underused features\n  - Explorer → Guided adoption roadmap\n  - Struggler → Rescue plan, executive alignment\n  - Disconnected → Last-resort executive outreach\n- Pricing approach: hold, discount, expand?\n- Contract terms to propose\n\n5. TALKING POINTS (5-7 bullet points)\n- Specific conversation starters based on their data\n- Reference specific interactions, metrics, or events\n- Questions to ask (not generic — informed by their history)\n- What to avoid saying (based on known sensitivities)\n\n6. OBJECTION PREP\n- Likely objections based on engagement history and deal stage\n- Prepared responses for each\n- If competitor was mentioned, competitive positioning\n\n7. EXPANSION OPPORTUNITIES\n- Based on usage patterns, what could they buy more of?\n- Estimated expansion ARR\n- How to introduce the expansion conversation naturally\n\n8. NEWS & CONTEXT\n- Recent company news that affects the renewal\n- Industry trends to reference\n- Anything from their website that's relevant\n\n9. AFTER THE MEETING\n- Recommended follow-up actions\n- What to update in HubSpot after the call\n- Next milestone in the renewal process\n\nTONE: Direct, strategic, actionable. This brief should take 3 minutes to read and leave the AE feeling fully prepared. No generic advice — every point should reference this specific account's data.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "meeting_prep", "type": "text", "required": false}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000010",
    "type": "output_formatter",
    "label": "Display meeting prep brief",
    "order": 9,
    "inputs": [
      {"name": "heading", "value": "Renewal Meeting Prep: {{ account_name }} — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ meeting_prep }}\n\n---\n*This brief was generated from your HubSpot data — deal history, engagements, contacts, and recent company news.*\n\n---\nWant meeting prep for every renewal automatically? BaseCommand generates briefs before every meeting and tracks follow-through. [Start free trial](https://basecommand.ai/signup)", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a6000001-0001-0001-0001-000000000011",
    "type": "send_message",
    "label": "Email meeting prep to user",
    "order": 10,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Meeting Prep: {{ account_name }} | {{ deal.properties.amount }} ARR | Renews {{ deal.properties.closedate }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ meeting_prep }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 7: Duplicate Merger

**Type:** Workflow Agent
**Trigger:** Manual + Scheduled (monthly)
**Price:** $10/mo
**Solves:** HubSpot Gap #2 — Bulk merge for duplicates (513 upvotes, declined)

### Why This Sells

HubSpot's duplicate management only allows one-by-one merging. For a 5,000-contact database with 200 duplicates, that's hours of manual work. This agent pulls all records, identifies duplicates with fuzzy matching, ranks them by priority, and generates a step-by-step merge plan with direct HubSpot links.

### Flow
```
Step 0: Ask which object to scan (contacts, companies)
Step 1: Pull all records
Step 2: LLM → fuzzy duplicate detection + merge plan
Step 3: Create HubSpot notes on duplicate records for easy finding
Step 4: Format as merge plan with HubSpot direct links
Step 5: Generate downloadable merge plan CSV
Step 6: Email report
```

### Actions JSON

```json
[
  {
    "id": "a7000001-0001-0001-0001-000000000001",
    "type": "get_user_input",
    "label": "What do you want to deduplicate?",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "dropdown", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "Which object type should I scan for duplicates?", "type": "text", "required": true},
      {"name": "default_value", "value": "contacts", "type": "text", "required": false},
      {"name": "input_name", "value": "object_type", "type": "text", "required": true}
    ]
  },
  {
    "id": "a7000001-0001-0001-0001-000000000002",
    "type": "hubspot.v2.search_objects",
    "label": "Pull all records",
    "order": 1,
    "inputs": [
      {"name": "object_type", "value": "{{ object_type }}", "type": "dropdown", "required": true},
      {"name": "properties", "value": ["firstname", "lastname", "email", "company", "phone", "jobtitle", "domain", "name", "createdate", "lastmodifieddate", "num_associated_deals"], "type": "properties", "required": false},
      {"name": "output_variable_name", "value": "all_records", "type": "text", "required": true},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a7000001-0001-0001-0001-000000000003",
    "type": "invoke_llm",
    "label": "AI: Identify duplicates and create merge plan",
    "order": 2,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a CRM data deduplication expert. Analyze these HubSpot records and identify ALL duplicate groups.\n\nRECORDS:\n{{ all_records }}\n\nObject type: {{ object_type }}\nHubSpot Portal ID: {{ hubspot_portal_id }}\n\nDUPLICATE DETECTION RULES:\n1. EXACT MATCH: same email address (case-insensitive)\n2. FUZZY NAME MATCH:\n   - Company: 'Acme Corp' = 'Acme Corporation' = 'ACME Corp.' = 'Acme, Inc.'\n   - Contact: 'John Smith' = 'Jon Smith' = 'J. Smith' (same company)\n3. CROSS-FIELD: same phone number, different name\n4. DOMAIN MATCH: same email domain + similar name\n\nFor each duplicate group, produce:\n- Group ID (1, 2, 3...)\n- All records in the group (with HubSpot IDs)\n- WINNER: the record to keep (most complete: has email, has deals, most recently active)\n- LOSERS: records to merge INTO the winner\n- Confidence: HIGH (exact email match), MEDIUM (fuzzy name), LOW (possible match)\n- Merge priority: CRITICAL (both have deals), HIGH (duplicate with data), LOW (low-value duplicate)\n- Direct HubSpot merge URL: https://app.hubspot.com/contacts/{{ hubspot_portal_id }}/record/0-1/[WINNER_ID]\n\nAlso produce:\n- Total records scanned\n- Total duplicate groups found\n- Estimated time saved (3 minutes per manual merge × number of merges)\n- Records with no duplicates (clean)\n\nReturn as JSON:\n{\"groups\": [{\"id\": 1, \"records\": [], \"winner_id\": \"\", \"loser_ids\": [], \"confidence\": \"\", \"priority\": \"\", \"merge_url\": \"\", \"reason\": \"\"}], \"summary\": {\"total_scanned\": 0, \"duplicate_groups\": 0, \"estimated_time_saved_mins\": 0}}", "type": "textarea", "required": true},
      {"name": "output_json_schema", "value": "{\"type\": \"object\", \"properties\": {\"groups\": {\"type\": \"array\"}, \"summary\": {\"type\": \"object\"}}}", "type": "json-schema", "required": false},
      {"name": "output_variable_name", "value": "dedup_analysis", "type": "text", "required": false}
    ]
  },
  {
    "id": "a7000001-0001-0001-0001-000000000004",
    "type": "parallel_for_condition",
    "label": "Tag duplicate records in HubSpot with notes",
    "order": 3,
    "inputs": [
      {"name": "loop_count", "value": "{{ dedup_analysis.summary.duplicate_groups }}", "type": "text", "required": true},
      {"name": "output_variable_name", "value": "tag_results", "type": "text", "required": true},
      {"name": "variable_name", "value": "group_index", "type": "text", "required": true}
    ]
  },
  {
    "id": "a7000001-0001-0001-0001-000000000005",
    "type": "hubspot.v2.create_engagement",
    "label": "Add merge note to winner record",
    "order": 4,
    "inputs": [
      {"name": "object_type", "value": "note", "type": "dropdown", "required": true},
      {"name": "content_body", "value": "AI DUPLICATE DETECTED (Group {{ dedup_analysis.groups[group_index].id }}): This record is the recommended WINNER. Merge the following records into this one: {{ dedup_analysis.groups[group_index].loser_ids }}. Confidence: {{ dedup_analysis.groups[group_index].confidence }}. Reason: {{ dedup_analysis.groups[group_index].reason }}", "type": "textarea", "required": true},
      {"name": "associations", "value": [{"objectType": "{{ object_type }}", "objectId": "{{ dedup_analysis.groups[group_index].winner_id }}"}], "type": "associations", "required": false}
    ]
  },
  {
    "id": "a7000001-0001-0001-0001-000000000006",
    "type": "end_condition",
    "label": "End tagging loop",
    "order": 5,
    "inputs": []
  },
  {
    "id": "a7000001-0001-0001-0001-000000000007",
    "type": "invoke_llm",
    "label": "AI: Format merge plan report",
    "order": 6,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o-mini", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "Format this deduplication analysis as a clean, actionable merge plan report.\n\nSections:\n1. Summary Dashboard (total scanned, duplicates found, estimated time saved)\n2. Critical Merges First (groups with priority=CRITICAL, sorted by confidence)\n3. Full Merge Plan Table (Group | Winner | Losers | Confidence | Priority | HubSpot Link)\n4. Step-by-Step Merge Instructions for HubSpot:\n   a. Click the merge URL link\n   b. Search for the duplicate record\n   c. Select which properties to keep\n   d. Click Merge\n5. Note: I've added notes to each winner record in HubSpot so you can find them easily by searching 'AI DUPLICATE DETECTED'\n\nMake the HubSpot merge URLs clickable.\n\nData: {{ dedup_analysis }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "merge_report", "type": "text", "required": false}
    ]
  },
  {
    "id": "a7000001-0001-0001-0001-000000000008",
    "type": "create_file",
    "label": "Generate merge plan CSV",
    "order": 7,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "Group,Winner ID,Winner Name,Loser IDs,Confidence,Priority,Merge URL,Reason\n{{ dedup_analysis.groups }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "merge_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a7000001-0001-0001-0001-000000000009",
    "type": "output_formatter",
    "label": "Display merge plan",
    "order": 8,
    "inputs": [
      {"name": "heading", "value": "Duplicate Merge Plan — {{ dedup_analysis.summary.duplicate_groups }} groups found", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ merge_report }}\n\n---\n**Download:** [Full Merge Plan (CSV)]({{ merge_csv }})\n\n---\n*HubSpot only lets you merge one at a time — but now you have a prioritized plan.*\nNotes have been added to duplicate records in HubSpot for easy finding.\n\n[Try our Data Cleaner](https://agent.ai/agent/basecommand-data-cleaner) for a full data quality audit.", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a7000001-0001-0001-0001-000000000010",
    "type": "send_message",
    "label": "Email merge plan",
    "order": 9,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Duplicate Merge Plan: {{ dedup_analysis.summary.duplicate_groups }} groups | ~{{ dedup_analysis.summary.estimated_time_saved_mins }} min saved | {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ merge_report }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 8: Exec Brief Generator (UPGRADE from Knowledge Agent)

**Type:** Workflow Agent (replaces existing Knowledge Agent)
**Trigger:** Manual + Scheduled (weekly)
**Price:** $10/mo

### Upgrade from Knowledge Agent

The existing Exec Brief Generator requires users to paste portfolio data. The workflow version auto-pulls everything from HubSpot and generates a board-ready brief with zero manual input.

### Flow
```
Step 0: Pull entire portfolio from HubSpot
Step 1: Pull engagement data for context
Step 2: Get previous brief from database (for week-over-week comparison)
Step 3: LLM → generate executive brief with retention narrative, risks, wins, talking points
Step 4: Store current brief in database (for next week's comparison)
Step 5: Create downloadable PDF
Step 6: Format and display
Step 7: Email to user
```

### Actions JSON

```json
[
  {
    "id": "a8000001-0001-0001-0001-000000000001",
    "type": "hubspot.v2.search_objects",
    "label": "Pull full portfolio from HubSpot",
    "order": 0,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "dealstage", "operator": "NEQ", "value": "closedlost"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "hubspot_owner_id", "ai_health_score", "ai_archetype", "ai_risk_signals", "notes_last_updated"], "type": "properties", "required": false},
      {"name": "associations", "value": ["contacts", "companies"], "type": "associations", "required": false},
      {"name": "output_variable_name", "value": "portfolio", "type": "text", "required": true},
      {"name": "output_sort", "value": "closedate", "type": "dropdown", "required": false},
      {"name": "output_sort_dir", "value": "ASCENDING", "type": "dropdown", "required": false},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a8000001-0001-0001-0001-000000000002",
    "type": "get_variable_from_database",
    "label": "Get last week's brief for comparison",
    "order": 1,
    "inputs": [
      {"name": "variable", "value": "exec_brief_snapshot", "type": "text", "required": true},
      {"name": "variable_retrieval_depth", "value": "most_recent_value", "type": "dropdown", "required": true},
      {"name": "output_variable", "value": "last_brief", "type": "text", "required": true}
    ]
  },
  {
    "id": "a8000001-0001-0001-0001-000000000003",
    "type": "invoke_llm",
    "label": "AI: Generate executive brief",
    "order": 2,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a VP-level renewal intelligence analyst generating a weekly executive brief.\n\nCURRENT PORTFOLIO:\n{{ portfolio }}\n\nLAST WEEK'S SNAPSHOT (for comparison):\n{{ last_brief }}\n\nToday: {{ current_date }}\n\nGenerate an EXECUTIVE BRIEF with these sections:\n\n1. HEADLINE (one line)\n- Example: 'Q2 retention at 94% with $320K at risk across 4 accounts — 2 new escalations this week'\n\n2. WEEK-OVER-WEEK CHANGES (if last_brief available)\n- Accounts that improved (moved to safer stage, health score up)\n- Accounts that declined (stage regression, new risk signals)\n- New accounts added\n- Accounts closed (won or lost)\n- Net ARR movement\n\n3. FORECAST SNAPSHOT\n- Total portfolio ARR\n- Projected GRR and NRR\n- This month: committed vs at-risk\n- This quarter: committed vs at-risk\n\n4. ESCALATIONS NEEDING EXEC ATTENTION (max 3)\n- Account name, ARR, specific issue, what the exec should do, deadline\n- Only accounts where executive action changes the outcome\n\n5. WINS WORTH HIGHLIGHTING\n- Renewals closed, expansions won, saves achieved\n- Name specific accounts and ARR\n\n6. TALKING POINTS (copy-paste ready for Slack or slides)\n- 5-7 bullets a director can paste into their leadership update\n\n7. THIS WEEK'S PRIORITIES\n- Top 5 actions ranked by revenue impact\n- Who should do each, by when\n\nAlso return a snapshot object for week-over-week tracking:\n{\"date\": \"{{ current_date }}\", \"total_arr\": 0, \"grr\": 0, \"nrr\": 0, \"at_risk_count\": 0, \"at_risk_arr\": 0, \"healthy_count\": 0}\n\nTONE: Tight, executive-ready. A busy director should scan this in 60 seconds. No filler. Start with the headline.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "exec_brief", "type": "text", "required": false}
    ]
  },
  {
    "id": "a8000001-0001-0001-0001-000000000004",
    "type": "store_variable_to_database",
    "label": "Save this week's snapshot for future comparison",
    "order": 3,
    "inputs": [
      {"name": "variable", "value": "{{ exec_brief }}", "type": "text", "required": true},
      {"name": "output_variable", "value": "exec_brief_snapshot", "type": "text", "required": true}
    ]
  },
  {
    "id": "a8000001-0001-0001-0001-000000000005",
    "type": "create_file",
    "label": "Generate brief as PDF",
    "order": 4,
    "inputs": [
      {"name": "file_type", "value": "pdf", "type": "dropdown", "required": true},
      {"name": "body", "value": "{{ exec_brief }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "brief_pdf", "type": "text", "required": true}
    ]
  },
  {
    "id": "a8000001-0001-0001-0001-000000000006",
    "type": "output_formatter",
    "label": "Display executive brief",
    "order": 5,
    "inputs": [
      {"name": "heading", "value": "Executive Brief — Week of {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ exec_brief }}\n\n---\n**Download:** [Executive Brief (PDF)]({{ brief_pdf }})\n\n---\n*This brief auto-updates weekly. Week-over-week comparisons will improve as more snapshots are stored.*\n\nBaseCommand generates these briefs automatically and tracks trends across quarters. [Start free trial](https://basecommand.ai/signup)", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a8000001-0001-0001-0001-000000000007",
    "type": "send_message",
    "label": "Email executive brief",
    "order": 6,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Weekly Renewal Brief — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ exec_brief }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 9: Forecast Intelligence with Delta Tracking (UPGRADE)

**Type:** Workflow Agent (replaces existing Knowledge Agent)
**Trigger:** Manual + Scheduled (weekly — Friday)
**Price:** $10/mo

### Upgrade from Knowledge Agent

The existing Forecast Intelligence requires pasting data. The workflow version auto-pulls from HubSpot AND tracks week-over-week forecast movement using agent.ai's database.

### Key Differentiator: Delta Tracking

This agent stores each week's forecast snapshot and compares against previous weeks. Users see not just "where we are" but "how we're moving" — which is what every VP cares about.

### Actions JSON

```json
[
  {
    "id": "a9000001-0001-0001-0001-000000000001",
    "type": "hubspot.v2.search_objects",
    "label": "Pull portfolio with amounts and dates",
    "order": 0,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "dealstage", "operator": "NEQ", "value": "closedlost"},
        {"propertyName": "amount", "operator": "GT", "value": "0"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "hs_deal_stage_probability", "ai_health_score", "ai_archetype"], "type": "properties", "required": false},
      {"name": "output_variable_name", "value": "deals", "type": "text", "required": true},
      {"name": "output_sort", "value": "closedate", "type": "dropdown", "required": false},
      {"name": "output_sort_dir", "value": "ASCENDING", "type": "dropdown", "required": false},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a9000001-0001-0001-0001-000000000002",
    "type": "get_variable_from_database",
    "label": "Get historical forecast snapshots",
    "order": 1,
    "inputs": [
      {"name": "variable", "value": "forecast_snapshot", "type": "text", "required": true},
      {"name": "variable_retrieval_depth", "value": "all_values", "type": "dropdown", "required": true},
      {"name": "agent_db_historical_values", "value": "weekly", "type": "dropdown", "required": false},
      {"name": "agent_db_variable_retrieval_count", "value": "4", "type": "text", "required": false},
      {"name": "output_variable", "value": "historical_forecasts", "type": "text", "required": true}
    ]
  },
  {
    "id": "a9000001-0001-0001-0001-000000000003",
    "type": "invoke_llm",
    "label": "AI: Build forecast with delta tracking",
    "order": 2,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a board-ready renewal forecasting engine with DELTA TRACKING capabilities.\n\nCURRENT DEALS:\n{{ deals }}\n\nHISTORICAL FORECAST SNAPSHOTS (last 4 weeks):\n{{ historical_forecasts }}\n\nToday: {{ current_date }}\n\nProduce:\n\n1. FORECAST HEADLINE\n- GRR, NRR, total ARR, and how each CHANGED vs last week\n- Example: 'GRR 93.2% (+1.1% WoW) | NRR 107.4% (-0.3% WoW) | $4.2M renewing'\n\n2. WEEK-OVER-WEEK MOVEMENT\n- Deals that moved UP in confidence (stage advancement, health improvement)\n- Deals that moved DOWN (stage regression, new risk signals)\n- New deals entering the forecast\n- Deals that closed (won or lost) since last snapshot\n- Net ARR movement: positive or negative\n\n3. FORECAST BY PERIOD (This Month, Next Month, This Quarter, Next Quarter)\n- Committed / Probable / At Risk with account names and ARR\n- Show delta vs last week for each tier\n\n4. THREE SCENARIOS with deltas:\n- Best Case: value + change vs last week\n- Expected: value + change vs last week\n- Downside: value + change vs last week\n\n5. TREND ANALYSIS (if 3+ weeks of data)\n- Is GRR trending up or down? Plot the trajectory.\n- Is at-risk ARR growing or shrinking?\n- Forecast confidence: improving or declining?\n\n6. RISK CALLOUTS — accounts with worsening signals\n\n7. TOP 5 ACTIONS to improve the forecast this week\n\nAlso return a snapshot for storage:\n{\"date\": \"{{ current_date }}\", \"total_arr\": 0, \"committed_arr\": 0, \"probable_arr\": 0, \"at_risk_arr\": 0, \"grr\": 0.0, \"nrr\": 0.0, \"deal_count\": 0, \"at_risk_count\": 0}\n\nSHOW YOUR MATH. GRR = retained / total. NRR = (retained + expansion) / total.", "type": "textarea", "required": true},
      {"name": "output_json_schema", "value": "{\"type\": \"object\", \"properties\": {\"report\": {\"type\": \"string\"}, \"snapshot\": {\"type\": \"object\"}}}", "type": "json-schema", "required": false},
      {"name": "output_variable_name", "value": "forecast_with_delta", "type": "text", "required": false}
    ]
  },
  {
    "id": "a9000001-0001-0001-0001-000000000004",
    "type": "store_variable_to_database",
    "label": "Save this week's forecast snapshot",
    "order": 3,
    "inputs": [
      {"name": "variable", "value": "{{ forecast_with_delta.snapshot }}", "type": "text", "required": true},
      {"name": "output_variable", "value": "forecast_snapshot", "type": "text", "required": true}
    ]
  },
  {
    "id": "a9000001-0001-0001-0001-000000000005",
    "type": "create_file",
    "label": "Generate forecast CSV",
    "order": 4,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "Account,ARR,Renewal Date,Stage,Confidence Tier,Health Score,WoW Change\n{{ forecast_with_delta }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "forecast_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a9000001-0001-0001-0001-000000000006",
    "type": "output_formatter",
    "label": "Display forecast with deltas",
    "order": 5,
    "inputs": [
      {"name": "heading", "value": "Renewal Forecast — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ forecast_with_delta.report }}\n\n---\n**Download:** [Forecast Data (CSV)]({{ forecast_csv }})\n\n---\n*This forecast tracks week-over-week movement. Run it every Friday for trend analysis.*\n\nBaseCommand provides real-time forecast tracking with automated alerts when deals shift tiers. [Start free trial](https://basecommand.ai/signup)", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a9000001-0001-0001-0001-000000000007",
    "type": "send_message",
    "label": "Email forecast",
    "order": 6,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Renewal Forecast: GRR {{ forecast_with_delta.snapshot.grr }}% | NRR {{ forecast_with_delta.snapshot.nrr }}% | {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ forecast_with_delta.report }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Wave 2 Scheduling Recommendations

| Agent | Recommended Schedule | Day | Why |
|-------|---------------------|-----|-----|
| Win/Loss Analyzer | Monthly | 1st of month | Quarterly business review cadence |
| Renewal Meeting Prep | Manual (before meetings) | — | On-demand per meeting |
| Duplicate Merger | Monthly | 15th of month | Regular hygiene cycle |
| Exec Brief Generator | Weekly | Monday 7am | Start the week with portfolio status |
| Forecast Intelligence | Weekly | Friday 3pm | End the week with forecast update |

---

## Complete Agent Fleet After Wave 2

| # | Agent | Type | Price | Wave |
|---|-------|------|-------|------|
| 1 | CRM Data Parser | Knowledge | Free | Existing |
| 2 | Renewal Autopilot | Knowledge | Free | Existing |
| 3 | Renewal Health Scanner | Workflow | $10/mo | Wave 1 |
| 4 | Renewal Forecast Engine | Workflow | $10/mo | Wave 1 |
| 5 | Deal Stage Timer | Workflow | $10/mo | Wave 1 |
| 6 | HubSpot Data Cleaner | Workflow | $10/mo | Wave 1 |
| 7 | Win/Loss Analyzer | Workflow | $10/mo | Wave 2 |
| 8 | Renewal Meeting Prep | Workflow | $10/mo | Wave 2 |
| 9 | Duplicate Merger | Workflow | $10/mo | Wave 2 |
| 10 | Exec Brief Generator | Workflow | $10/mo | Wave 2 |
| 11 | Forecast Intelligence | Workflow | $10/mo | Wave 2 |

**Total: 11 agents (2 free, 9 paid at $10/mo)**

### Revenue Potential (conservative — 6 months post-launch)
- 9 paid agents × 100 subscribers avg × $10/mo = **$9,000/mo**
- Plus BaseCommand platform conversions from funnel agents

### Bundle Opportunity
Pitch to agent.ai: **"Renewal Intelligence Team"** — bundle all 9 paid agents for $25/mo (vs $90/mo individual). Similar to their Meeting Intelligence Team model.
