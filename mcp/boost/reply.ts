import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

/**
 * Every tool answers with pretty-printed JSON in a single text block: it is the
 * format models parse most reliably, and it stays readable when a human is
 * watching the transcript.
 */
export function text(value: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  }
}

export function failure(message: string, detail?: unknown): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: detail ? `${message}\n\n${JSON.stringify(detail, null, 2)}` : message,
      },
    ],
  }
}
