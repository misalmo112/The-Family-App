# SQL Query Accuracy Improvements Plan

## Overview

Enhance the SQL query generation accuracy in `dynamicsqlquery_react_docker.py` by implementing three critical improvements: using the specialized sql_coder model, fixing database dialect mismatch, and adding SQL validation with automatic error correction.

## Current Issues

1. **Line 265**: Uses `llm` (llama3.1) instead of `sql_coder_llm` for SQL generation
2. **Line 236**: Prompt incorrectly states "oracle data base" when using SQLite
3. **No validation**: Generated SQL is not tested for syntax errors or execution failures
4. **Prompt clarity**: Instructions could be more specific for SQLite syntax and patterns

## Implementation Plan

### 1. Fix SQL Generation Model Usage

**File**: `dynamicsqlquery_react_docker.py`**Location**: Line 265

- Change from `llm.invoke(final_prompt)` to `sql_coder_llm.invoke(final_prompt)`
- The `sql_coder_llm` is already initialized (lines 108-112) but not used for SQL generation
- sqlcoder model is specifically trained for SQL generation tasks

### 2. Fix Database Dialect in Prompt

**File**: `dynamicsqlquery_react_docker.py`**Location**: Line 236 in `generate_sql()` function

- Change "for an oracle data base" to "for a SQLite database"
- Update instructions to reference SQLite-specific syntax where relevant

### 3. Enhance SQL Generation Prompt

**File**: `dynamicsqlquery_react_docker.py`**Location**: Lines 232-258 (`generate_sql()` function)

- Improve prompt template with clearer instructions
- Add SQLite-specific guidance
- Better formatting for readability
- More explicit instructions about returning only SQL (no markdown, no explanations)

### 4. Add SQL Validation and Error Correction Loop

**File**: `dynamicsqlquery_react_docker.py`**Location**: After line 265, before final print statements

- Create `validate_and_refine_sql()` function that:
- Attempts to execute the generated SQL query
- Catches execution errors
- Uses sql_coder_llm to refine the query based on error messages
- Supports up to 3 refinement iterations
- Returns the corrected SQL or the last attempt
- Add SQL cleaning logic to remove markdown code blocks from LLM output
- Integrate validation into the main flow after SQL generation

### 5. Add Helper Function for SQL Cleaning

**File**: `dynamicsqlquery_react_docker.py`**Location**: Before `validate_and_refine_sql()` function

- Create `clean_sql_output()` function to:
- Remove markdown code blocks (```sql ... ```)
- Strip leading/trailing whitespace
- Extract SQL from mixed text responses

## Code Structure Changes

```javascript
Current flow:
  generate_sql() → llm.invoke() → print result

New flow:
  generate_sql() → sql_coder_llm.invoke() → clean_sql_output() → 
  validate_and_refine_sql() → print result
```



## Key Functions to Add/Modify

1. **`clean_sql_output(sql_text: str) -> str`**

- Removes markdown formatting
- Extracts pure SQL query

2. **`validate_and_refine_sql(sql_query: str, schema: str, question: str, max_iterations: int = 3) -> str`**

- Executes SQL and catches errors
- Refines query using error feedback
- Returns validated/corrected SQL

3. **`generate_sql()` - Enhanced**

- Updated prompt template
- Fixed dialect reference
- Improved instructions

## Error Handling

- Wrap SQL execution in try-except blocks
- Log errors with clear messages
- Limit refinement iterations to prevent infinite loops
- Fallback to original query if all refinements fail

## Testing Considerations

- Validation will catch syntax errors immediately
- Error correction will improve accuracy for edge cases
- Multiple iterations may increase processing time slightly
- Should handle common SQLite errors (table not found, column not found, syntax errors)

## Files to Modify

- `dynamicsqlquery_react_docker.py` - Main implementation file

## Dependencies

- No new dependencies required