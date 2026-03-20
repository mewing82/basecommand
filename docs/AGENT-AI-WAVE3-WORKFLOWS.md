# Agent.ai Wave 3 — Workflow Agent Specs (Month 2)

**Last updated:** 2026-03-20
**Reference:** `docs/LLM.txt` (Agent.AI Actions Generator)
**Depends on:** Wave 1 + Wave 2 live

---

## Wave 3 Overview

All 6 agents are **HubSpot Gap Fillers** — solving highly-upvoted feature requests that HubSpot declined to build. These target the broadest HubSpot audience (not just renewal teams).

| # | Agent | HubSpot Gap | Price | Target User |
|---|-------|------------|-------|-------------|
| 1 | **Smart Sequence Builder** | #9 — Conditional logic for sequences | $10/mo | Sales reps, SDRs |
| 2 | **Product Calculator** | #8 — Calculated properties for products | $10/mo | Sales ops, deal desk |
| 3 | **Multi-Currency Reporter** | #13 — Multi-currency reporting | $10/mo | International sales leaders |
| 4 | **SLA Business Hours Calculator** | #4 — Business hours SLA | $10/mo | Support managers |
| 5 | **Email Performance Optimizer** | #25 — A/B testing limitations | $10/mo | Marketing managers |
| 6 | **Property Audit Bot** | General CRM hygiene | $10/mo | RevOps, admins |

---

## Workflow 10: Smart Sequence Builder

**Type:** Workflow Agent
**Trigger:** Manual
**Price:** $10/mo
**Solves:** HubSpot Gap #9 — Conditional logic for sequences (filed 2020, significant demand)

### Why This Sells

HubSpot sequences are linear — send email 1, wait, send email 2, wait, send email 3. No branching. No "if opened, do X; if not, do Y." Every sales rep wants conditional logic but HubSpot explicitly declined it to keep Sequences simple (vs Workflows).

This agent analyzes the user's deal pipeline and engagement patterns, then generates a complete branching outreach STRATEGY — multiple sequence paths, enrollment criteria, and the actual email templates. The user creates the sequences manually in HubSpot, but the AI does all the thinking.

### Flow
```
Step 0: Ask the outreach goal (renewal, re-engagement, expansion, cold)
Step 1: Pull deals matching the goal criteria
Step 2: Get engagement history (what emails work?)
Step 3: LLM → generate branching sequence strategy + email templates
Step 4: Format as implementable playbook
Step 5: Create downloadable file with email templates
Step 6: Email to user
```

### Actions JSON

```json
[
  {
    "id": "a10000001-0001-0001-0001-00000000001",
    "type": "get_user_input",
    "label": "What's your outreach goal?",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "dropdown", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "What type of outreach sequence do you need?", "type": "text", "required": true},
      {"name": "default_value", "value": "renewal_outreach", "type": "text", "required": false},
      {"name": "input_name", "value": "sequence_goal", "type": "text", "required": true}
    ]
  },
  {
    "id": "a10000001-0001-0001-0001-00000000002",
    "type": "get_user_input",
    "label": "Describe your ideal customer and situation",
    "order": 1,
    "inputs": [
      {"name": "input_type", "value": "textarea", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "Describe the accounts you're targeting, your product, and any context (e.g., 'SaaS platform, $50K-$200K deals, renewing in 60 days, some showing declining usage')", "type": "text", "required": true},
      {"name": "input_name", "value": "context", "type": "text", "required": true}
    ]
  },
  {
    "id": "a10000001-0001-0001-0001-00000000003",
    "type": "hubspot.v2.search_objects",
    "label": "Pull relevant deals for pattern analysis",
    "order": 2,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "dealstage", "operator": "NEQ", "value": "closedlost"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "hubspot_owner_id"], "type": "properties", "required": false},
      {"name": "output_variable_name", "value": "deals", "type": "text", "required": true},
      {"name": "output_limit", "value": "50", "type": "text", "required": false}
    ]
  },
  {
    "id": "a10000001-0001-0001-0001-00000000004",
    "type": "invoke_llm",
    "label": "AI: Generate branching sequence strategy + email templates",
    "order": 3,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a sales sequence architect. HubSpot sequences can't branch, so you design MULTIPLE sequences that work together as a branching system.\n\nGOAL: {{ sequence_goal }}\nCONTEXT: {{ context }}\nDEAL DATA: {{ deals }}\nUser: {{ user_name }}\n\nDesign a BRANCHING SEQUENCE SYSTEM:\n\n1. SEQUENCE MAP (visual flowchart in text)\n```\nSequence A: Initial Outreach (all contacts)\n  ├── IF opened email 1 → Sequence B: Engaged Follow-up\n  ├── IF NOT opened → Sequence C: Re-engagement \n  └── IF replied → EXIT (manual takeover)\n\nSequence B: Engaged Follow-up\n  ├── IF clicked link → Sequence D: Demo Push\n  └── IF no click → Continue B (nurture)\n\nSequence C: Re-engagement\n  ├── IF opens → Move to Sequence B\n  └── IF 3 emails no open → Sequence E: Breakup\n```\n\n2. FOR EACH SEQUENCE, provide:\n- Sequence name (use in HubSpot)\n- Enrollment criteria (which contacts, how to filter)\n- Number of steps\n- Timing between steps\n- Exit criteria (when to unenroll)\n\n3. EMAIL TEMPLATES — for every email in every sequence:\n- Subject line (with A/B variant)\n- Body (150-250 words, personalized with HubSpot tokens like {first_name}, {company})\n- CTA (clear single action)\n- Tone calibrated to the sequence stage\n\n4. HUBSPOT IMPLEMENTATION GUIDE:\n- Step-by-step: how to create each sequence in HubSpot\n- How to set up enrollment triggers (use HubSpot workflows to auto-enroll based on behavior)\n- How to simulate branching: 'Create a workflow that checks email engagement after 3 days and enrolls in the next sequence'\n- Properties to create for tracking (e.g., 'sequence_path', 'sequence_stage')\n\n5. MEASUREMENT PLAN:\n- KPIs per sequence (open rate, reply rate, meeting booked rate)\n- When to iterate (if reply rate < X%, test new subject lines)\n- A/B testing approach for subject lines\n\nMake it copy-paste ready. A rep should be able to build these sequences in HubSpot in 30 minutes.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "sequence_strategy", "type": "text", "required": false}
    ]
  },
  {
    "id": "a10000001-0001-0001-0001-00000000005",
    "type": "create_file",
    "label": "Generate email templates file",
    "order": 4,
    "inputs": [
      {"name": "file_type", "value": "txt", "type": "dropdown", "required": true},
      {"name": "body", "value": "{{ sequence_strategy }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "templates_file", "type": "text", "required": true}
    ]
  },
  {
    "id": "a10000001-0001-0001-0001-00000000006",
    "type": "output_formatter",
    "label": "Display sequence strategy",
    "order": 5,
    "inputs": [
      {"name": "heading", "value": "Smart Sequence Strategy — {{ sequence_goal }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ sequence_strategy }}\n\n---\n**Download:** [Full Strategy + Email Templates]({{ templates_file }})\n\n---\n*HubSpot sequences can't branch — but this strategy uses multiple sequences + workflows to simulate branching logic.*\n\nBaseCommand generates personalized outreach for every account based on health score and archetype. [Start free trial](https://basecommand.ai/signup)", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a10000001-0001-0001-0001-00000000007",
    "type": "send_message",
    "label": "Email sequence strategy",
    "order": 6,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Smart Sequence Strategy: {{ sequence_goal }} | Ready to build in HubSpot", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ sequence_strategy }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 11: Product Calculator

**Type:** Workflow Agent
**Trigger:** Manual
**Price:** $10/mo
**Solves:** HubSpot Gap #8 — Calculated properties for products (years of requests)

### Why This Sells

HubSpot's product library has no calculated fields. You can't compute margin, unit price, volume discounts, or bundle savings natively. Sales ops teams build spreadsheets alongside HubSpot. This agent pulls product/line item data and does all the math.

### Flow
```
Step 0: Ask what calculation to run (margin analysis, bundle optimization, pricing comparison)
Step 1: Pull deals with line items
Step 2: LLM → calculate margins, bundles, discounts, pricing optimization
Step 3: Format as pricing analysis report
Step 4: Generate downloadable CSV
Step 5: Email report
```

### Actions JSON

```json
[
  {
    "id": "a11000001-0001-0001-0001-00000000001",
    "type": "get_user_input",
    "label": "What analysis do you need?",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "dropdown", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "What product analysis should I run?", "type": "text", "required": true},
      {"name": "default_value", "value": "margin_analysis", "type": "text", "required": false},
      {"name": "input_name", "value": "analysis_type", "type": "text", "required": true}
    ]
  },
  {
    "id": "a11000001-0001-0001-0001-00000000002",
    "type": "hubspot.v2.search_objects",
    "label": "Pull deals with line items",
    "order": 1,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "amount", "operator": "GT", "value": "0"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "hs_acv"], "type": "properties", "required": false},
      {"name": "associations", "value": ["line_items", "companies"], "type": "associations", "required": false},
      {"name": "output_variable_name", "value": "deals_with_products", "type": "text", "required": true},
      {"name": "output_limit", "value": "100", "type": "text", "required": false}
    ]
  },
  {
    "id": "a11000001-0001-0001-0001-00000000003",
    "type": "invoke_llm",
    "label": "AI: Run product calculations and analysis",
    "order": 2,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a deal desk analyst. HubSpot can't do calculated properties on products — you fill that gap.\n\nANALYSIS TYPE: {{ analysis_type }}\nDEALS WITH LINE ITEMS: {{ deals_with_products }}\n\nPerform ALL of these calculations:\n\n1. MARGIN ANALYSIS (per deal and per product):\n- Revenue per product line\n- If cost data available: margin %, margin $\n- Average deal margin across portfolio\n- Highest and lowest margin deals\n- Products with best/worst margins\n\n2. BUNDLE ANALYSIS:\n- Which products are most commonly sold together?\n- What's the average deal size by product combination?\n- Bundle recommendations: 'Customers who buy X also buy Y (78% of the time)'\n- Suggested bundle pricing (discount for buying together)\n\n3. PRICING ANALYSIS:\n- Average selling price per product\n- Price variance (are reps discounting inconsistently?)\n- Discount rate by deal size (do bigger deals get bigger discounts?)\n- Price per unit calculations (total / quantity)\n- Volume discount patterns\n\n4. PRODUCT MIX:\n- Revenue by product (pie chart data)\n- Deals by product count (how many products per deal?)\n- Single-product vs multi-product deal size comparison\n- Fastest-selling products (by close rate)\n\n5. RECOMMENDATIONS:\n- Pricing optimization suggestions\n- Bundle opportunities to increase deal size\n- Discounting guardrails (max discount by product)\n- Products to push (high margin, low penetration)\n\nFormat as tables with clear calculations. Show your math.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "product_analysis", "type": "text", "required": false}
    ]
  },
  {
    "id": "a11000001-0001-0001-0001-00000000004",
    "type": "create_file",
    "label": "Generate product analysis CSV",
    "order": 3,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "{{ product_analysis }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "product_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a11000001-0001-0001-0001-00000000005",
    "type": "output_formatter",
    "label": "Display product analysis",
    "order": 4,
    "inputs": [
      {"name": "heading", "value": "Product Analysis — {{ analysis_type }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ product_analysis }}\n\n---\n**Download:** [Full Product Data (CSV)]({{ product_csv }})\n\n---\n*These are the calculated properties HubSpot won't give you.* Margin, unit price, bundle analysis — all from your real deal data.\n\n[Try our Renewal Forecast Engine](https://agent.ai/agent/basecommand-forecast) for revenue forecasting.", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a11000001-0001-0001-0001-00000000006",
    "type": "send_message",
    "label": "Email product analysis",
    "order": 5,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Product Analysis: {{ analysis_type }} | {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ product_analysis }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 12: Multi-Currency Reporter

**Type:** Workflow Agent
**Trigger:** Manual + Scheduled (monthly)
**Price:** $10/mo
**Solves:** HubSpot Gap #13 — Multi-currency reporting and goals

### Why This Sells

HubSpot reports and goals only display in the portal's default currency. A company selling in USD, EUR, and GBP sees everything converted to USD at the exchange rate when the deal was created — not current rates. Forecasts and reports are always slightly wrong. This agent pulls all deals, normalizes to the user's preferred currency at current rates, and produces accurate multi-currency reports.

### Actions JSON

```json
[
  {
    "id": "a12000001-0001-0001-0001-00000000001",
    "type": "get_user_input",
    "label": "Base currency for reporting",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "dropdown", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "What currency should all amounts be reported in?", "type": "text", "required": true},
      {"name": "default_value", "value": "USD", "type": "text", "required": false},
      {"name": "input_name", "value": "base_currency", "type": "text", "required": true},
      {"name": "show_in_agent_settings", "value": true, "type": "checkbox", "required": false}
    ]
  },
  {
    "id": "a12000001-0001-0001-0001-00000000002",
    "type": "hubspot.v2.search_objects",
    "label": "Pull all deals with currency info",
    "order": 1,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "amount", "operator": "GT", "value": "0"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["dealname", "amount", "closedate", "dealstage", "pipeline", "deal_currency_code", "amount_in_home_currency", "hubspot_owner_id", "hs_exchange_rate"], "type": "properties", "required": false},
      {"name": "associations", "value": ["companies"], "type": "associations", "required": false},
      {"name": "output_variable_name", "value": "all_deals", "type": "text", "required": true},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a12000001-0001-0001-0001-00000000003",
    "type": "rest_call",
    "label": "Get current exchange rates",
    "order": 2,
    "inputs": [
      {"name": "url", "value": "https://api.exchangerate-api.com/v4/latest/{{ base_currency }}", "type": "text", "required": true},
      {"name": "method", "value": "GET", "type": "dropdown", "required": true},
      {"name": "format", "value": "JSON", "type": "dropdown", "required": true},
      {"name": "output_variable_name", "value": "exchange_rates", "type": "text", "required": true}
    ]
  },
  {
    "id": "a12000001-0001-0001-0001-00000000004",
    "type": "invoke_llm",
    "label": "AI: Normalize currencies and build report",
    "order": 3,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a financial reporting analyst. HubSpot can't do multi-currency reporting properly — amounts are frozen at the exchange rate when the deal was created, not current rates. Fix this.\n\nDEALS:\n{{ all_deals }}\n\nCURRENT EXCHANGE RATES (base: {{ base_currency }}):\n{{ exchange_rates }}\n\nFor EVERY deal:\n1. Identify original currency (deal_currency_code)\n2. Convert to {{ base_currency }} using CURRENT exchange rates\n3. Calculate the difference vs HubSpot's stored amount_in_home_currency (the FX impact)\n\nProduce:\n\n1. CURRENCY SUMMARY\n- Total pipeline by original currency (USD: $X, EUR: €Y, GBP: £Z)\n- Total pipeline normalized to {{ base_currency }} at current rates\n- Total FX impact vs HubSpot's stored values (positive = HubSpot understates, negative = overstates)\n\n2. PIPELINE BY CURRENCY (table)\n- Currency | Deal Count | Original Amount | {{ base_currency }} Equivalent | FX Impact\n\n3. DEAL-LEVEL DETAIL (table)\n- Deal | Original Currency | Original Amount | {{ base_currency }} at Current Rate | HubSpot Amount | FX Variance\n\n4. FX RISK ANALYSIS\n- Which currencies have the most exposure?\n- Deals where FX movement >5% since creation\n- Quarterly FX impact on forecast\n\n5. REGIONAL BREAKDOWN\n- Revenue by region/currency zone\n- Win rates by currency (are international deals harder to close?)\n- Average deal size by currency\n\n6. RECOMMENDATIONS\n- Deals where FX risk warrants early renewal to lock in rate\n- Currency hedging suggestions for large deals\n- HubSpot setup tips for better multi-currency tracking\n\nShow your math on every conversion. Accuracy matters for finance teams.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "currency_report", "type": "text", "required": false}
    ]
  },
  {
    "id": "a12000001-0001-0001-0001-00000000005",
    "type": "create_file",
    "label": "Generate normalized revenue CSV",
    "order": 4,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "{{ currency_report }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "currency_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a12000001-0001-0001-0001-00000000006",
    "type": "output_formatter",
    "label": "Display multi-currency report",
    "order": 5,
    "inputs": [
      {"name": "heading", "value": "Multi-Currency Revenue Report — {{ base_currency }} | {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ currency_report }}\n\n---\n**Download:** [Normalized Revenue Data (CSV)]({{ currency_csv }})\n\n---\n*HubSpot freezes exchange rates at deal creation. This report uses today's rates for accurate forecasting.*\n\nExchange rates via exchangerate-api.com as of {{ current_date }}.", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a12000001-0001-0001-0001-00000000007",
    "type": "send_message",
    "label": "Email currency report",
    "order": 6,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Multi-Currency Report ({{ base_currency }}): FX-adjusted pipeline | {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ currency_report }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 13: SLA Business Hours Calculator

**Type:** Workflow Agent
**Trigger:** Manual + Scheduled (weekly)
**Price:** $10/mo
**Solves:** HubSpot Gap #4 — Business hours SLA calculations

### Why This Sells

HubSpot Service Hub calculates Time to First Reply and Time to Close in **calendar hours** — weekends and holidays included. A ticket opened Friday at 5pm and responded to Monday at 9am shows as "62 hours" in HubSpot, when the actual business-hours response time is 1 hour. Every support team with SLA commitments needs business-hours math.

### Actions JSON

```json
[
  {
    "id": "a13000001-0001-0001-0001-00000000001",
    "type": "get_user_input",
    "label": "Define your business hours",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "text", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "Your business hours (e.g., 'Mon-Fri 9am-6pm EST')", "type": "text", "required": true},
      {"name": "default_value", "value": "Mon-Fri 9:00-18:00 EST", "type": "text", "required": false},
      {"name": "input_name", "value": "business_hours", "type": "text", "required": true},
      {"name": "show_in_agent_settings", "value": true, "type": "checkbox", "required": false}
    ]
  },
  {
    "id": "a13000001-0001-0001-0001-00000000002",
    "type": "get_user_input",
    "label": "SLA targets",
    "order": 1,
    "inputs": [
      {"name": "input_type", "value": "text", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "Your SLA targets (e.g., 'First reply: 4 business hours, Resolution: 24 business hours')", "type": "text", "required": true},
      {"name": "default_value", "value": "First reply: 4 hours, Resolution: 24 hours", "type": "text", "required": false},
      {"name": "input_name", "value": "sla_targets", "type": "text", "required": true},
      {"name": "show_in_agent_settings", "value": true, "type": "checkbox", "required": false}
    ]
  },
  {
    "id": "a13000001-0001-0001-0001-00000000003",
    "type": "hubspot.v2.search_objects",
    "label": "Pull recent tickets",
    "order": 2,
    "inputs": [
      {"name": "object_type", "value": "tickets", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "createdate", "operator": "GTE", "value": "-30d"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["subject", "content", "hs_pipeline_stage", "createdate", "closed_date", "hs_ticket_priority", "hubspot_owner_id", "time_to_close", "time_to_first_agent_reply", "hs_resolution"], "type": "properties", "required": false},
      {"name": "associations", "value": ["contacts", "companies"], "type": "associations", "required": false},
      {"name": "output_variable_name", "value": "tickets", "type": "text", "required": true},
      {"name": "output_limit", "value": "200", "type": "text", "required": false}
    ]
  },
  {
    "id": "a13000001-0001-0001-0001-00000000004",
    "type": "invoke_llm",
    "label": "AI: Recalculate SLAs in business hours",
    "order": 3,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are an SLA compliance analyst. HubSpot calculates response and resolution times in CALENDAR hours. You must recalculate everything in BUSINESS HOURS.\n\nBUSINESS HOURS: {{ business_hours }}\nSLA TARGETS: {{ sla_targets }}\nTICKETS: {{ tickets }}\nToday: {{ current_date }}\n\nFor EVERY ticket, calculate:\n1. Time to First Reply — in business hours (exclude nights, weekends, holidays)\n2. Time to Resolution — in business hours\n3. SLA Status: MET, BREACHED, or AT_RISK (>80% of SLA consumed)\n4. Calendar vs Business Hours difference (how much HubSpot overstates)\n\nProduce:\n\n1. SLA COMPLIANCE DASHBOARD\n- First Reply SLA: X% met (target: {{ sla_targets }})\n- Resolution SLA: X% met\n- Average first reply: X business hours\n- Average resolution: X business hours\n- HubSpot's numbers vs actual (calendar vs business hours comparison)\n\n2. SLA BREACHES (sorted by severity)\n- Ticket | Priority | Created | First Reply (biz hrs) | Resolution (biz hrs) | SLA Status | Breach Amount\n- Only breached and at-risk tickets\n\n3. TEAM PERFORMANCE\n- SLA compliance by agent/owner\n- Average response time by agent (business hours)\n- Ticket volume by agent\n- Best/worst performers\n\n4. PRIORITY BREAKDOWN\n- SLA compliance by ticket priority (Critical, High, Medium, Low)\n- Average times by priority\n- Where are the worst breaches happening?\n\n5. TIME-OF-DAY ANALYSIS\n- When do most tickets come in?\n- Off-hours tickets (submitted outside business hours) — how are they handled?\n- Monday morning backlog size\n\n6. RECOMMENDATIONS\n- Staffing suggestions (gaps in coverage)\n- SLA target adjustments (are targets realistic?)\n- Process improvements to reduce resolution time\n- Tickets that are still open and at risk of breaching\n\nShow your business hours calculations. A support manager needs to trust these numbers.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "sla_analysis", "type": "text", "required": false}
    ]
  },
  {
    "id": "a13000001-0001-0001-0001-00000000005",
    "type": "create_file",
    "label": "Generate SLA report CSV",
    "order": 4,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "{{ sla_analysis }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "sla_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a13000001-0001-0001-0001-00000000006",
    "type": "output_formatter",
    "label": "Display SLA report",
    "order": 5,
    "inputs": [
      {"name": "heading", "value": "SLA Compliance Report (Business Hours) — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ sla_analysis }}\n\n---\n**Download:** [Full SLA Data (CSV)]({{ sla_csv }})\n\n---\n*HubSpot counts weekends and nights in SLA calculations. This report uses your actual business hours: {{ business_hours }}.*\n\nRun this weekly to track SLA compliance trends.", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a13000001-0001-0001-0001-00000000007",
    "type": "send_message",
    "label": "Email SLA report",
    "order": 6,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "SLA Report: {{ current_date }} | Business Hours Compliance", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ sla_analysis }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 14: Email Performance Optimizer

**Type:** Workflow Agent
**Trigger:** Manual + Scheduled (weekly)
**Price:** $10/mo
**Solves:** HubSpot Gap #25 — A/B testing limitations

### Why This Sells

HubSpot's email A/B testing is basic — split on subject line or send time, that's it. No multivariate testing, no sequence-level optimization, no cross-campaign pattern analysis. This agent pulls all marketing email data and does deep performance analysis with AI-powered recommendations.

### Actions JSON

```json
[
  {
    "id": "a14000001-0001-0001-0001-00000000001",
    "type": "hubspot.v2.search_objects",
    "label": "Pull marketing email campaigns",
    "order": 0,
    "inputs": [
      {"name": "object_type", "value": "marketing_emails", "type": "dropdown", "required": true},
      {"name": "filters", "value": [
        {"propertyName": "createdate", "operator": "GTE", "value": "-90d"}
      ], "type": "properties", "required": false},
      {"name": "properties", "value": ["name", "subject", "type", "state", "stats_sent", "stats_open", "stats_click", "stats_unsubscribe", "stats_bounce", "stats_reply", "publishdate", "campaign"], "type": "properties", "required": false},
      {"name": "output_variable_name", "value": "emails", "type": "text", "required": true},
      {"name": "output_limit", "value": "100", "type": "text", "required": false}
    ]
  },
  {
    "id": "a14000001-0001-0001-0001-00000000002",
    "type": "invoke_llm",
    "label": "AI: Analyze email performance and optimize",
    "order": 1,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are an email marketing optimization expert. Analyze these HubSpot marketing emails and provide deep performance insights.\n\nEMAIL DATA:\n{{ emails }}\n\nToday: {{ current_date }}\n\nProduce:\n\n1. PERFORMANCE DASHBOARD\n- Total emails sent (last 90 days)\n- Average open rate, click rate, unsubscribe rate\n- Best performing email (by click rate)\n- Worst performing email\n- Trend: improving or declining over the period?\n\n2. SUBJECT LINE ANALYSIS\n- Top 5 performing subject lines with metrics\n- Bottom 5 performing subject lines\n- Pattern analysis: what makes a subject line work? (length, personalization, urgency, questions, numbers)\n- AI-generated A/B test suggestions for next 5 campaigns\n\n3. SEND TIME OPTIMIZATION\n- Performance by day of week\n- Performance by time of day (if derivable from publish dates)\n- Recommended send windows\n- Days/times to avoid\n\n4. CONTENT PATTERNS\n- Email types performing best (newsletters, promotional, triggered)\n- CTAs that get the most clicks\n- Optimal email length patterns\n- Personalization impact\n\n5. LIST HEALTH\n- Bounce rate trends (growing = list decay)\n- Unsubscribe rate trends\n- Engagement segmentation: active vs disengaged contacts\n- Recommended list cleanup actions\n\n6. AI RECOMMENDATIONS (top 10)\n- Specific, numbered, actionable changes\n- Each with estimated impact on open/click rate\n- A/B tests to run next\n- Subject line templates based on top performers\n\nBenchmark against B2B SaaS averages: open rate 22-28%, click rate 2-5%, unsubscribe <0.5%.", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "email_analysis", "type": "text", "required": false}
    ]
  },
  {
    "id": "a14000001-0001-0001-0001-00000000003",
    "type": "create_file",
    "label": "Generate email performance CSV",
    "order": 2,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "{{ email_analysis }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "email_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a14000001-0001-0001-0001-00000000004",
    "type": "output_formatter",
    "label": "Display email optimization report",
    "order": 3,
    "inputs": [
      {"name": "heading", "value": "Email Performance Optimizer — Last 90 Days", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ email_analysis }}\n\n---\n**Download:** [Full Performance Data (CSV)]({{ email_csv }})\n\n---\n*HubSpot's A/B testing only does subject line splits. This analysis looks at patterns across all your campaigns to find what actually works.*\n\nRun weekly to track if your optimization changes are working.", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a14000001-0001-0001-0001-00000000005",
    "type": "send_message",
    "label": "Email optimization report",
    "order": 4,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "Email Performance Report: {{ current_date }} | 10 optimization recommendations", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ email_analysis }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Workflow 15: Property Audit Bot

**Type:** Workflow Agent
**Trigger:** Manual + Scheduled (quarterly)
**Price:** $10/mo
**Target:** RevOps admins, HubSpot administrators

### Why This Sells

Every HubSpot portal accumulates cruft over time — unused properties, duplicate properties with slightly different names, inconsistent naming conventions, properties that were created for a campaign and never cleaned up. There's no native tool to audit this. RevOps teams inherit messy portals and spend days figuring out what's used and what's junk.

### Actions JSON

```json
[
  {
    "id": "a15000001-0001-0001-0001-00000000001",
    "type": "get_user_input",
    "label": "Which objects to audit?",
    "order": 0,
    "inputs": [
      {"name": "input_type", "value": "dropdown", "type": "dropdown", "required": true},
      {"name": "input_description", "value": "Which object types should I audit? (contacts, companies, deals, or all)", "type": "text", "required": true},
      {"name": "default_value", "value": "all", "type": "text", "required": false},
      {"name": "input_name", "value": "audit_scope", "type": "text", "required": true}
    ]
  },
  {
    "id": "a15000001-0001-0001-0001-00000000002",
    "type": "hubspot.v2.search_objects",
    "label": "Pull sample contacts with all properties",
    "order": 1,
    "inputs": [
      {"name": "object_type", "value": "contacts", "type": "dropdown", "required": true},
      {"name": "output_variable_name", "value": "sample_contacts", "type": "text", "required": true},
      {"name": "output_limit", "value": "50", "type": "text", "required": false}
    ]
  },
  {
    "id": "a15000001-0001-0001-0001-00000000003",
    "type": "hubspot.v2.search_objects",
    "label": "Pull sample deals with all properties",
    "order": 2,
    "inputs": [
      {"name": "object_type", "value": "deals", "type": "dropdown", "required": true},
      {"name": "output_variable_name", "value": "sample_deals", "type": "text", "required": true},
      {"name": "output_limit", "value": "50", "type": "text", "required": false}
    ]
  },
  {
    "id": "a15000001-0001-0001-0001-00000000004",
    "type": "hubspot.v2.search_objects",
    "label": "Pull sample companies with all properties",
    "order": 3,
    "inputs": [
      {"name": "object_type", "value": "companies", "type": "dropdown", "required": true},
      {"name": "output_variable_name", "value": "sample_companies", "type": "text", "required": true},
      {"name": "output_limit", "value": "50", "type": "text", "required": false}
    ]
  },
  {
    "id": "a15000001-0001-0001-0001-00000000005",
    "type": "invoke_llm",
    "label": "AI: Audit property usage and quality",
    "order": 4,
    "inputs": [
      {"name": "llm_engine", "value": "gpt-4o", "type": "dropdown", "required": true},
      {"name": "instructions", "value": "You are a HubSpot CRM architect auditing property hygiene. Analyze the property schemas and usage from these sample records.\n\nCONTACTS (sample): {{ sample_contacts }}\nDEALS (sample): {{ sample_deals }}\nCOMPANIES (sample): {{ sample_companies }}\nPortal: {{ hubspot_portal_id }}\n\nPerform a PROPERTY AUDIT:\n\n1. PROPERTY INVENTORY\n- Count: total custom properties per object (contacts, deals, companies)\n- List every custom property name found\n- Categorize: actively used (>50% fill rate), partially used (10-50%), rarely used (<10%), empty (0%)\n\n2. NAMING ISSUES\n- Inconsistent naming: snake_case vs camelCase vs spaces\n- Similar names that might be duplicates (e.g., 'lead_source' and 'leadsource' and 'Lead Source')\n- Generic/unclear names (e.g., 'custom1', 'field_a', 'temp')\n- Names that suggest test/temp properties ('test_', 'temp_', 'old_')\n\n3. UNUSED PROPERTIES (candidates for deletion)\n- Properties with 0% fill rate across all sample records\n- Properties that haven't been updated in 6+ months\n- Properties that duplicate HubSpot default properties\n\n4. DATA TYPE ISSUES\n- Text fields storing numbers (should be number type)\n- Free text fields that should be dropdowns (limited set of values)\n- Date fields with inconsistent formats\n- Multi-select fields with too many options\n\n5. BEST PRACTICES ASSESSMENT\n- Score: A/B/C/D/F overall property hygiene\n- Property count vs recommended (<100 custom per object)\n- Naming convention consistency (% following a standard)\n- Fill rate health (what % of properties are actively used)\n\n6. CLEANUP PLAN (prioritized)\n- Phase 1 (safe to delete): clearly unused, test, or duplicate properties\n- Phase 2 (consolidate): properties to merge or rename\n- Phase 3 (restructure): data type changes, dropdown conversions\n- Estimated time to complete each phase\n\n7. GOVERNANCE RECOMMENDATIONS\n- Naming convention to adopt going forward\n- Property request process\n- Quarterly audit schedule\n- Properties to add for better data quality", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "property_audit", "type": "text", "required": false}
    ]
  },
  {
    "id": "a15000001-0001-0001-0001-00000000006",
    "type": "create_file",
    "label": "Generate property inventory CSV",
    "order": 5,
    "inputs": [
      {"name": "file_type", "value": "csv", "type": "dropdown", "required": true},
      {"name": "body", "value": "{{ property_audit }}", "type": "textarea", "required": true},
      {"name": "output_variable_name", "value": "audit_csv", "type": "text", "required": true}
    ]
  },
  {
    "id": "a15000001-0001-0001-0001-00000000007",
    "type": "output_formatter",
    "label": "Display property audit report",
    "order": 6,
    "inputs": [
      {"name": "heading", "value": "HubSpot Property Audit — {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ property_audit }}\n\n---\n**Download:** [Property Inventory (CSV)]({{ audit_csv }})\n\n---\n*Run this quarterly to prevent property sprawl. A clean CRM is a fast CRM.*\n\n[Try our HubSpot Data Cleaner](https://agent.ai/agent/basecommand-data-cleaner) for record-level hygiene.", "type": "textarea", "required": true},
      {"name": "format", "value": "markdown", "type": "dropdown", "required": true}
    ]
  },
  {
    "id": "a15000001-0001-0001-0001-00000000008",
    "type": "send_message",
    "label": "Email property audit",
    "order": 7,
    "inputs": [
      {"name": "type", "value": "email", "type": "dropdown", "required": true},
      {"name": "to", "value": "current_user", "type": "dropdown", "required": true},
      {"name": "subject", "value": "HubSpot Property Audit: Grade {{ property_audit }} | {{ current_date }}", "type": "text", "required": false},
      {"name": "output_formatted", "value": "{{ property_audit }}", "type": "textarea", "required": true}
    ]
  }
]
```

---

## Complete Fleet After All 3 Waves

| # | Agent | Category | Price | Wave | Target User |
|---|-------|----------|-------|------|-------------|
| 1 | CRM Data Parser | Renewal | Free | Existing | Anyone |
| 2 | Renewal Autopilot | Renewal | Free | Existing | AEs, CSMs |
| 3 | Renewal Health Scanner | Renewal | $10/mo | Wave 1 | CS leaders |
| 4 | Renewal Forecast Engine | Renewal | $10/mo | Wave 1 | VP Revenue |
| 5 | Deal Stage Timer | HubSpot Gap | $10/mo | Wave 1 | Sales managers |
| 6 | HubSpot Data Cleaner | HubSpot Gap | $10/mo | Wave 1 | RevOps |
| 7 | Win/Loss Analyzer | HubSpot Gap | $10/mo | Wave 2 | VP Sales |
| 8 | Renewal Meeting Prep | Renewal | $10/mo | Wave 2 | AEs, CSMs |
| 9 | Duplicate Merger | HubSpot Gap | $10/mo | Wave 2 | RevOps |
| 10 | Exec Brief Generator | Renewal | $10/mo | Wave 2 | Directors, VPs |
| 11 | Forecast w/ Delta | Renewal | $10/mo | Wave 2 | VP Revenue |
| 12 | Smart Sequence Builder | HubSpot Gap | $10/mo | Wave 3 | SDRs, AEs |
| 13 | Product Calculator | HubSpot Gap | $10/mo | Wave 3 | Sales ops |
| 14 | Multi-Currency Reporter | HubSpot Gap | $10/mo | Wave 3 | Intl. sales |
| 15 | SLA Business Hours Calc | HubSpot Gap | $10/mo | Wave 3 | Support mgrs |
| 16 | Email Performance Opt | Utility | $10/mo | Wave 3 | Marketing mgrs |
| 17 | Property Audit Bot | Utility | $10/mo | Wave 3 | RevOps, admins |

**Total: 17 agents (2 free, 15 paid at $10/mo)**

### Revenue Potential

| Scenario | Avg Subscribers/Agent | Monthly Revenue |
|----------|----------------------|----------------|
| Conservative (6 mo) | 75 | $11,250/mo |
| Moderate (12 mo) | 150 | $22,500/mo |
| Aggressive (featured placement) | 300 | $45,000/mo |

### Bundle Strategy

Propose to agent.ai:
- **Renewal Intelligence Team** (agents 3, 4, 8, 10, 11) — $25/mo
- **HubSpot Power Tools Team** (agents 5, 6, 7, 9, 12, 13) — $25/mo
- **Full BaseCommand Suite** (all 15 paid) — $49/mo

This mirrors agent.ai's existing team pricing ($25/mo for Meeting Intelligence Team).
