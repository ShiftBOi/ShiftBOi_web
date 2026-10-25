"use client";

import { AssistantMarkdown } from "@/components/management/ai-hub/assistant-markdown";
import {
  toolLineTitle,
  toolsSummaryStatus,
  toolsSummaryTitle,
  toolTraceStatus,
} from "@/components/management/ai-hub/assistant-trace";
import { renderTextWithCommands } from "@/components/management/ai-hub/command-chip";
import { renderTextWithMentions } from "@/components/management/ai-hub/mention-chip";
import type { MentionOption } from "@/components/management/ai-hub/assistant-composer";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { cn } from "cn";
import {
  CircleCheck,
  Copy,
  Database,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useState } from "react";

export type AssistantToolNeedConfirm = {
  action: string;
  slug: string;
  published?: boolean;
};

export type AssistantToolChip = {
  id: string;
  name: string;
  status: "running" | "done" | "error";
  summary?: string;
  needConfirm?: AssistantToolNeedConfirm;
  confirmResolved?: boolean;
};

export type AssistantTurnMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  thoughtFor?: number;
  tools?: AssistantToolChip[];
  sources?: Array<{ title: string; snippet: string }>;
  status?: string;
};

function looksLikeRichText(text: string) {
  const t = text.trim();
  if (t.length < 40) return false;
  if (/\n/.test(t)) return true;
  if (
    /^#{1,3}\s|^\s*[-*•]\s|\*\*[^*]+\*\*|`[^`]+`|\|.*\||```|<p\b|<br\b/i.test(
      t,
    )
  )
    return true;
  return /key\s*features|technology\s*stack/i.test(t);
}

function renderUserText(
  text: string,
  mentions: MentionOption[],
) {
  return renderTextWithCommands(text, (chunk) =>
    renderTextWithMentions(chunk, mentions),
  );
}

function ReasoningBlock({
  text,
  thoughtFor,
  streaming,
}: {
  text: string;
  thoughtFor?: number;
  streaming: boolean;
}) {
  const running = streaming && !thoughtFor;
  const [open, setOpen] = useState<boolean>();

  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>
        {running ? (
          <Loader2 className="animate-spin" />
        ) : (
          <CircleCheck />
        )}
      </TraceIcon>
      <TraceTitle>
        {running
          ? "Thinking"
          : thoughtFor
            ? `Thought for ${thoughtFor}s`
            : "Thought"}
      </TraceTitle>
      {!running && thoughtFor ? (
        <TraceDescription>{thoughtFor}s</TraceDescription>
      ) : null}
    </TraceLine>
  );

  if (!text) return line;

  return (
    <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="whitespace-pre-wrap">
        {text}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function ToolStep({ tool }: { tool: AssistantToolChip }) {
  const status = toolTraceStatus(tool.status);
  const title = toolLineTitle(tool.name, tool.status, tool.summary);
  const detail = tool.summary || "";

  if (tool.status === "done" || tool.status === "error") {
    return (
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine status={status}>
            <TraceIcon>
              {tool.status === "error" ? (
                <ShieldAlert />
              ) : (
                <Wrench />
              )}
            </TraceIcon>
            <TraceTitle>{title}</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          {detail ? (
            <CodeBlock size="sm">
              <CodeBlockContent wrap className="max-h-64">
                {detail}
              </CodeBlockContent>
            </CodeBlock>
          ) : (
            <p className="text-xs text-muted-foreground">No output</p>
          )}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    );
  }

  return (
    <TraceLine status={status}>
      <TraceIcon>
        <Loader2 className="animate-spin" />
      </TraceIcon>
      <TraceTitle>{title}</TraceTitle>
    </TraceLine>
  );
}

function ToolsChain({
  tools,
  streaming,
}: {
  tools: AssistantToolChip[];
  streaming: boolean;
}) {
  const running = streaming && tools.some((t) => t.status === "running");
  const [open, setOpen] = useState<boolean>();

  return (
    <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>
        <TraceLine status={toolsSummaryStatus(tools)}>
          <TraceIcon>
            {running ? <Loader2 className="animate-spin" /> : <Wrench />}
          </TraceIcon>
          <TraceTitle>{toolsSummaryTitle(tools, streaming)}</TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent keepMounted>
        <Trace>
          {tools.map((t) => (
            <ToolStep key={t.id} tool={t} />
          ))}
        </Trace>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function SourcesBlock({
  sources,
}: {
  sources: Array<{ title: string; snippet: string }>;
}) {
  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>
        <TraceLine>
          <TraceIcon>
            <Database />
          </TraceIcon>
          <TraceTitle>
            Used {sources.length} source{sources.length === 1 ? "" : "s"}
          </TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Trace>
          {sources.map((s, i) => (
            <TraceLine key={`${s.title}-${i}`}>
              <TraceIcon>
                <Database />
              </TraceIcon>
              <TraceTitle>
                {s.title}
                {s.snippet ? (
                  <span className="ml-1 font-normal opacity-70">
                    — {s.snippet}
                  </span>
                ) : null}
              </TraceTitle>
            </TraceLine>
          ))}
        </Trace>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function ConfirmItem({
  tool,
  disabled,
  onResolve,
}: {
  tool: AssistantToolChip;
  disabled: boolean;
  onResolve: (approve: boolean) => void;
}) {
  const nc = tool.needConfirm!;
  const label =
    nc.action === "delete"
      ? "Delete"
      : nc.action === "unpublish"
        ? "Unpublish"
        : nc.action;

  return (
    <Item variant="outline" size="sm" className="cms-ai-confirm">
      <ItemMedia variant="icon">
        <ShieldAlert />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          Confirm {label} for {nc.slug}?
        </ItemTitle>
        <ItemDescription>
          This cannot be undone from chat.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => onResolve(false)}
        >
          Deny
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={() => onResolve(true)}
        >
          Approve
        </Button>
      </ItemActions>
    </Item>
  );
}

export function AssistantMessageTurn({
  message,
  mentions,
  streaming,
  isLast,
  onConfirm,
  onRetry,
  onRestore,
}: {
  message: AssistantTurnMessage;
  index?: number;
  mentions: MentionOption[];
  streaming: boolean;
  isLast: boolean;
  onConfirm: (toolId: string, approve: boolean) => void;
  onRetry: () => void;
  onRestore: () => void;
}) {
  const isStreaming =
    streaming && message.status === "streaming" && isLast;
  const pendingConfirms =
    message.tools?.filter((t) => t.needConfirm && !t.confirmResolved) || [];
  const showCheckpoint =
    message.role === "assistant" &&
    message.status !== "streaming" &&
    Boolean(message.content || message.tools?.length);

  if (message.role === "user") {
    return (
      <Message
        align="end"
        className="cms-ai-msg is-user"
        aria-busy={false}
      >
        <MessageContent>
          <Bubble variant="muted" align="end" className="cms-ai-msg__bubble">
            <BubbleContent className="cms-ai-msg__bubble--md">
              {looksLikeRichText(message.content) ? (
                <AssistantMarkdown text={message.content} />
              ) : (
                renderUserText(message.content, mentions)
              )}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    );
  }

  return (
    <div
      className={cn("cms-ai-msg is-assistant", "cms-ai-turn")}
      aria-busy={isStreaming}
    >
      <Message align="start">
        <MessageContent>
          <MessageHeader className="cms-ai-msg__mark">
            <Sparkles className="size-3.5" />
            Groq
          </MessageHeader>

          {(message.reasoning ||
            (isStreaming && !message.content && !message.thoughtFor) ||
            (message.tools && message.tools.length > 0) ||
            (message.sources && message.sources.length > 0)) && (
            <Trace className="cms-ai-trace">
              {message.reasoning ||
              (isStreaming && !message.content && !message.thoughtFor) ? (
                <ReasoningBlock
                  text={message.reasoning || ""}
                  thoughtFor={message.thoughtFor}
                  streaming={isStreaming && !message.content && !message.thoughtFor}
                />
              ) : null}

              {message.tools && message.tools.length > 0 ? (
                <ToolsChain tools={message.tools} streaming={isStreaming} />
              ) : null}

              {message.sources && message.sources.length > 0 ? (
                <SourcesBlock sources={message.sources} />
              ) : null}
            </Trace>
          )}

          {pendingConfirms.map((t) => (
            <ConfirmItem
              key={`confirm-${t.id}`}
              tool={t}
              disabled={streaming}
              onResolve={(approve) => onConfirm(t.id, approve)}
            />
          ))}

          {message.content ? (
            <div className="cms-ai-msg__md">
              <AssistantMarkdown text={message.content} />
            </div>
          ) : isStreaming ? (
            <p className="cms-ai-msg__thinking">Thinking…</p>
          ) : null}

          {message.status === "stopped" ? (
            <p className="cms-ai-msg__stopped">Stopped</p>
          ) : null}

          {message.content && message.status !== "streaming" ? (
            <MessageFooter className="cms-ai-msg__actions">
              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard.writeText(message.content)
                }
              >
                <Copy className="size-3.5" /> Copy
              </button>
              <button type="button" onClick={onRetry}>
                <RefreshCw className="size-3.5" /> Retry
              </button>
            </MessageFooter>
          ) : null}
        </MessageContent>
      </Message>

      {showCheckpoint ? (
        <Marker variant="separator" className="cms-ai-checkpoint">
          <MarkerContent className="inline-flex items-center gap-2">
            Checkpoint
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={onRestore}
            >
              Restore
            </Button>
          </MarkerContent>
        </Marker>
      ) : null}
    </div>
  );
}
