# AI Providers

## Overview

Providers communicate with LLM APIs.

Providers contain no medical logic.

---

# Responsibilities

Providers

- send requests
- receive responses
- retry transport failures
- authenticate

Nothing more.

---

# Supported Providers

OpenAI

Anthropic

Gemini

DeepSeek

Azure OpenAI

Local Models

---

# Requirements

Every provider returns

- identical schema
- identical structure

Business logic must never depend on provider.

---

# Provider Contract

Input

Prompt

↓

Output

Structured JSON

---

# Never

Providers must never

- load knowledge
- build prompts
- perform diagnosis
- modify outputs
