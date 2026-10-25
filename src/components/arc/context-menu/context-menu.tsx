"use client";

import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { motionTokens } from "../lib/motion-tokens";
import dropdownStyles from "../dropdown-menu/dropdown-menu.module.css";
import styles from "./context-menu.module.css";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "cn";

type Highlight = { top: number; height: number; danger: boolean; glide: boolean };

const ITEM_SEL =
  '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

function openSubTriggerIn(content: HTMLElement): HTMLElement | null {
  const openSub = content.querySelector<HTMLElement>(
    `${ITEM_SEL}[data-state="open"], ${ITEM_SEL}[aria-expanded="true"]`
  );
  if (!openSub || !content.contains(openSub)) return null;
  return openSub;
}

function itemInMenu(
  content: HTMLElement,
  target: EventTarget | null
): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  const item = target.closest<HTMLElement>(ITEM_SEL);
  if (!item || !content.contains(item)) return null;
  return item;
}

function useMenuHighlight() {
  const reduced = useReducedMotion();
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const pointer = useRef(false);
  /** True while the cursor is over THIS panel (not a portaled submenu). */
  const pointerInPanel = useRef(false);
  const clearTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(clearTimer.current), []);

  function moveTo(item: HTMLElement, glide: boolean) {
    setHighlight((current) => ({
      top: item.offsetTop,
      height: item.offsetHeight,
      danger: item.dataset.tone === "danger",
      glide: glide && current !== null,
    }));
  }

  function onMenuFocus(event: FocusEvent<HTMLDivElement>) {
    window.clearTimeout(clearTimer.current);
    const content = event.currentTarget;
    const openSub = openSubTriggerIn(content);
    const item = itemInMenu(content, event.target);

    // Cursor is in the portaled submenu — ignore Open/Delete focus, stay on Color.
    if (!pointerInPanel.current && openSub) {
      moveTo(openSub, pointer.current);
      return;
    }

    if (item) {
      moveTo(item, pointer.current);
      return;
    }

    if (openSub) {
      moveTo(openSub, pointer.current);
      return;
    }

    clearTimer.current = window.setTimeout(
      () => setHighlight(null),
      pointer.current ? 70 : 0
    );
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    pointer.current = true;
    pointerInPanel.current = true;
    window.clearTimeout(clearTimer.current);
    const item = itemInMenu(event.currentTarget, event.target);
    if (item) moveTo(item, true);
  }

  function onPointerLeave(event: PointerEvent<HTMLDivElement>) {
    pointerInPanel.current = false;
    window.clearTimeout(clearTimer.current);
    const openSub = openSubTriggerIn(event.currentTarget);
    // Left this panel into the Color submenu → keep Color accent.
    if (openSub) {
      moveTo(openSub, false);
      return;
    }
    clearTimer.current = window.setTimeout(() => setHighlight(null), 80);
  }

  const highlightEl = (
    <motion.span
      className={dropdownStyles.highlight}
      data-tone={highlight?.danger ? "danger" : undefined}
      aria-hidden="true"
      initial={false}
      animate={
        highlight
          ? { y: highlight.top, height: highlight.height, opacity: 1 }
          : { opacity: 0 }
      }
      transition={{
        default:
          highlight?.glide && !reduced
            ? motionTokens.spring.snappy
            : { duration: 0 },
        opacity: { duration: reduced ? 0 : 0.08 },
      }}
    />
  );

  return {
    highlightEl,
    onMenuFocus,
    onPointerMove,
    onPointerLeave,
    onPointerMoveCapture: () => {
      pointer.current = true;
    },
    onKeyDownCapture: () => {
      pointer.current = false;
    },
  };
}

export function ArcContextMenu(props: ContextMenuPrimitive.ContextMenuProps) {
  // modal=false avoids body scroll-lock so the sidebar doesn't jump
  return <ContextMenuPrimitive.Root modal={false} {...props} />;
}

export function ArcContextMenuTrigger({
  className,
  ...props
}: ContextMenuPrimitive.ContextMenuTriggerProps) {
  return <ContextMenuPrimitive.Trigger className={className} {...props} />;
}

export function ArcContextMenuContent({
  className,
  children,
  ...props
}: ContextMenuPrimitive.ContextMenuContentProps) {
  const hl = useMenuHighlight();
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        {...props}
        className={cn(dropdownStyles.menu, styles.content, "cms-arc-menu", className)}
        collisionPadding={12}
        loop
        onFocus={hl.onMenuFocus}
        onPointerMove={hl.onPointerMove}
        onPointerLeave={hl.onPointerLeave}
        onPointerMoveCapture={hl.onPointerMoveCapture}
        onKeyDownCapture={hl.onKeyDownCapture}
      >
        {hl.highlightEl}
        {children}
      </ContextMenuPrimitive.Content>
    </ContextMenuPrimitive.Portal>
  );
}

export function ArcContextMenuItem({
  className,
  destructive,
  icon,
  children,
  index = 0,
  ...props
}: ContextMenuPrimitive.ContextMenuItemProps & {
  destructive?: boolean;
  icon?: ReactNode;
  index?: number;
}) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        dropdownStyles.item,
        destructive && dropdownStyles.destructive,
        className
      )}
      data-tone={destructive ? "danger" : undefined}
      style={{ "--i": index } as CSSProperties}
      {...props}
    >
      {icon ? (
        <span className={dropdownStyles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </ContextMenuPrimitive.Item>
  );
}

export function ArcContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.ContextMenuSeparatorProps) {
  return (
    <ContextMenuPrimitive.Separator
      className={cn(dropdownStyles.separator, className)}
      {...props}
    />
  );
}

export function ArcContextMenuLabel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(styles.label, className)}>{children}</div>;
}

export function ArcContextMenuSub(props: ContextMenuPrimitive.ContextMenuSubProps) {
  return <ContextMenuPrimitive.Sub {...props} />;
}

export function ArcContextMenuSubTrigger({
  className,
  icon,
  trailing,
  children,
  ...props
}: ContextMenuPrimitive.ContextMenuSubTriggerProps & {
  icon?: ReactNode;
  /** Renders just before the › chevron (e.g. a color swatch). */
  trailing?: ReactNode;
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      className={cn(dropdownStyles.item, styles.subTrigger, className)}
      {...props}
    >
      {icon ? (
        <span className={dropdownStyles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.subLabel}>{children}</span>
      {trailing ? (
        <span className={styles.trailing} aria-hidden="true">
          {trailing}
        </span>
      ) : null}
      <ChevronRight className={styles.chevron} size={14} strokeWidth={1.8} />
    </ContextMenuPrimitive.SubTrigger>
  );
}

export function ArcContextMenuSubContent({
  className,
  children,
  ...props
}: ContextMenuPrimitive.ContextMenuSubContentProps) {
  const hl = useMenuHighlight();
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        {...props}
        className={cn(
          dropdownStyles.menu,
          styles.subContent,
          "cms-arc-menu",
          className
        )}
        align="start"
        sideOffset={6}
        alignOffset={-4}
        collisionPadding={16}
        onFocus={hl.onMenuFocus}
        onPointerMove={hl.onPointerMove}
        onPointerLeave={hl.onPointerLeave}
        onPointerMoveCapture={hl.onPointerMoveCapture}
        onKeyDownCapture={hl.onKeyDownCapture}
      >
        {hl.highlightEl}
        {children}
      </ContextMenuPrimitive.SubContent>
    </ContextMenuPrimitive.Portal>
  );
}

export function ArcContextMenuRadioGroup(
  props: ContextMenuPrimitive.ContextMenuRadioGroupProps
) {
  return <ContextMenuPrimitive.RadioGroup {...props} />;
}

export function ArcContextMenuRadioItem({
  className,
  icon,
  children,
  index = 0,
  ...props
}: ContextMenuPrimitive.ContextMenuRadioItemProps & {
  icon?: ReactNode;
  index?: number;
}) {
  return (
    <ContextMenuPrimitive.RadioItem
      className={cn(dropdownStyles.item, styles.radioItem, className)}
      style={{ "--i": index } as CSSProperties}
      {...props}
    >
      {icon ? (
        <span className={dropdownStyles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.subLabel}>{children}</span>
      <ContextMenuPrimitive.ItemIndicator className={styles.indicator}>
        <span className={styles.dot} />
      </ContextMenuPrimitive.ItemIndicator>
    </ContextMenuPrimitive.RadioItem>
  );
}
