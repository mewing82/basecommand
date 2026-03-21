# Agent.ai Workflow Builder Rules

> **Purpose:** Reference file for generating valid agent.ai workflow JSON.
> Feed this to Claude/Cursor when building new agents. Contains tested patterns,
> valid enums, and gotchas discovered through live testing on 2026-03-21.
>
> **Full action reference:** `docs/LLM.txt` (45K tokens — the complete agent.ai action schema)

---

## CRITICAL RULES (learned from live testing failures)

### 1. HubSpot search output variables are NOT directly visible in later steps

The `output_variable_name` from `hubspot.v2.search_objects` is accessible in the
immediately next step but NOT in LLM `invoke_llm` instructions. You MUST bridge
with `set_variable`:

```
WRONG:  hubspot.v2.search_objects (output: hs_results) → invoke_llm ({{ hs_results }})
RIGHT:  hubspot.v2.search_objects (output: hs_results) → set_variable (deals_data = {{ hs_results.results }}) → invoke_llm ({{ deals_data }})
```

### 2. HubSpot object_type must use `hubspot_object_type` not `dropdown`

```json
WRONG:  {"name": "object_type", "value": "deals", "type": "dropdown"}
RIGHT:  {"name": "object_type", "value": "deals", "type": "hubspot_object_type"}
```

### 3. HubSpot search: do NOT include filters, associations, sort, or limit

These inputs cause 400 errors. Keep the search minimal:

```json
ONLY USE THESE INPUTS:
- object_type (hubspot_object_type)
- properties (properties array)
- output_variable_name (text)

DO NOT USE:
- filters (causes "list indices must be integers" or HubSpot API 400)
- associations (not in docs example)
- output_sort (not in docs example)
- output_sort_dir (not in docs example)
- output_limit (not in docs example)
```

Let the LLM filter results by date/stage/criteria in its prompt instead.

### 4. get_engagements object_type is ENGAGEMENT type, not source object

```json
WRONG:  {"name": "object_type", "value": "deal", ...}    — "deal" is not valid
RIGHT:  {"name": "object_type", "value": "note", ...}     — valid: note, call, email, meeting, task
```

### 5. Dropdown inputs need `dropdownOptions` with label/value pairs

```json
WRONG:
{"name": "dropdown_options", "value": "Option A\nOption B", "type": "textarea"}

RIGHT:
{"name": "input_type", "value": "dropdown (single)", "type": "dropdown",
 "dropdownOptions": [
   {"label": "Option A", "value": "Option A"},
   {"label": "Option B", "value": "Option B"}
 ]}
```

### 6. Input type for dropdowns is `dropdown (single)` not `dropdown`

```json
WRONG:  {"name": "input_type", "value": "dropdown", ...}
RIGHT:  {"name": "input_type", "value": "dropdown (single)", ...}
```

---

## VALID ENUM VALUES

### LLM Engines (invoke_llm)
```
auto, gpt-5.2, gpt-5.2-pro, gpt-5, gpt-5-mini, gpt-5-nano,
gpt-4.1, gpt4o, gpt-4o-mini, o3, o3-mini, o3-pro, o4-mini,
claude-haiku-4-5, claude-sonnet-4-6, claude-opus-4-6,
claude-opus-4-1-20250805, claude-sonnet-4-20250514, claude-opus-4-20250514,
gemini-3-pro-preview, gemini-2.5-pro-preview-05-06, gemini-2.5-flash-preview-04-17,
gemini-2.0-flash-exp, gemini_15_pro, gemini_15_flash,
perplexity, perplexity-deep-research,
deepseek-r1-distill-llama-70b, meta-llama/llama-4-scout-17b-16e-instruct,
llama-3.3-70b-versatile, gemma2-9b-it, gemma-7b-it
```

**Recommended:** `gpt4o` for analysis, `gpt-4o-mini` for formatting, `claude-sonnet-4-6` for premium

### get_user_input input_type
```
text, number, boolean, textarea, URL, website_domain,
dropdown (single), dropdown (multiple), multi_item_selector,
multi_item_selector_table, radio, HubSpot Portal, HubSpot Company, Knowledge Base
```

### get_engagements object_type
```
note, call, email, meeting, task
```

### rest_call format
```
json, xml, form
```
(lowercase — NOT "JSON", "XML", "Form")

### rest_call method
```
GET, POST, PUT, DELETE, PATCH, HEAD
```

### output_formatter format
```
auto, markdown, html, json, plain_text, table
```

### send_message type
```
email
```

### send_message to
```
current_user
```
(or use `email_addresses` input for custom recipients)

### create_file file_type
```
pdf, txt, csv, json, html, docx, xlsx
```

---

## TESTED PATTERNS

### Pattern: HubSpot Search → Process → Display

```
Step 0: get_user_input (preferences)
Step 1: hubspot.v2.search_objects → hs_search_results
Step 2: set_variable (deals_data = {{ hs_search_results.results }})
Step 3: set_variable (deal_count = {{ hs_search_results.total }})
Step 4: if_condition ({{ deal_count }} > 0)
Step 5: invoke_llm (analyze {{ deals_data }}) → analysis
Step 6: invoke_llm (format {{ analysis }}) → report
Step 7: output_formatter (display {{ report }})
Step 8: send_message (email {{ report }})
Step 9: end_condition
Step 10: if_condition ({{ deal_count }} == 0)
Step 11: output_formatter (no data message)
Step 12: end_condition
```

### Pattern: Loop Over Deals + Get Engagements

```
Step N: parallel_for_condition (loop_count={{ deal_count }}, variable=deal_index, output=deal_engagements)
Step N+1: hubspot.v2.get_engagements (source_object_id={{ hs_search_results.results[deal_index].id }}, object_type="note")
Step N+2: end_condition
```

Note: Inside the loop, reference `hs_search_results.results[deal_index].id` — the original
HubSpot output IS accessible inside loops (just not in LLM instructions).

### Pattern: Prevent LLM Hallucination

Always include in LLM instructions:
```
USE ONLY THE ACTUAL DATA PROVIDED — do not invent account names, ARR values, or scores.
If a field is missing, say so.

CRITICAL: Use the REAL deal names from the dealname property.
Use the REAL amounts from the amount property. Do NOT make up data.
```

---

## VARIABLE SCOPING RULES

| Source | Accessible in set_variable? | Accessible in invoke_llm? | Accessible in output_formatter? |
|--------|---------------------------|--------------------------|-------------------------------|
| `get_user_input` output | Yes | Yes | Yes |
| `set_variable` output | Yes | Yes | Yes |
| `hubspot.v2.*` output | Yes | **NO — must bridge via set_variable** | Yes (in `{{ }}`) |
| `invoke_llm` output | Yes | Yes | Yes |
| `parallel_for_condition` output | Yes | Yes | Yes |
| Runtime auto-vars (`current_date`, etc.) | Yes | Yes | Yes |

### Runtime Auto-Variables (always available)
```
user_email, user_name, user_id, run_id, agent_id,
current_date, current_time, current_datetime, timestamp, timezone,
hubspot_portal_id, hubspot_access_token
```

---

## JSON STRUCTURE TEMPLATE

Every action follows this structure:
```json
{
  "id": "<unique-uuid>",
  "type": "<action_type>",
  "label": "<human readable description>",
  "order": <sequential integer starting from 0>,
  "inputs": [
    {
      "name": "<input_name>",
      "value": "<value>",
      "type": "<input_type>",
      "required": true/false
    }
  ]
}
```

### Variable naming rules
- Must match regex: `^[a-zA-Z][a-zA-Z0-9_]*$`
- Start with letter, only letters/numbers/underscores
- Good: `deals_data`, `health_analysis`, `deal_count`
- Bad: `deal-data`, `1_deals`, `my results`

### Variable references
- Jinja syntax: `{{ variable_name }}`
- Nested: `{{ var.properties.field }}`
- Array: `{{ var[0] }}` or `{{ var.results[index].id }}`
- Secrets: `{{ secrets.secret_name }}`

---

## CHECKLIST BEFORE TESTING

- [ ] All `hubspot.v2.search_objects` use `"type": "hubspot_object_type"`
- [ ] No `filters`, `associations`, `output_sort`, `output_sort_dir`, `output_limit` on HubSpot search
- [ ] All HubSpot outputs bridged to LLM via `set_variable`
- [ ] All `invoke_llm` use valid engine enum (e.g., `gpt4o` not `gpt-4o`)
- [ ] All `get_engagements` use valid object_type (note/call/email/meeting/task)
- [ ] All dropdowns have `dropdownOptions` with `[{"label": "", "value": ""}]`
- [ ] All `rest_call` format is lowercase (`json` not `JSON`)
- [ ] All variable names match regex `^[a-zA-Z][a-zA-Z0-9_]*$`
- [ ] LLM prompts include anti-hallucination instructions
- [ ] Order numbers are sequential starting from 0
- [ ] Every `if_condition` / `for_condition` / `parallel_for_condition` has matching `end_condition`
