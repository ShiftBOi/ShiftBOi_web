"use client";

import Toast from "@/components/arc/toast/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "cn";
import { AlertTriangle, HelpCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CmsToastTone = "success" | "error" | "warning" | "info";

type ToastItem = {
  id: string;
  tone: CmsToastTone;
  title: string;
  description?: string;
  duration: number;
};

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ToastOptions = {
  description?: string;
  /** ms; 0 = stay until dismissed. Default 2000. */
  duration?: number;
};

const DEFAULT_TOAST_MS = 2000;

type CmsNotifyApi = {
  toast: (
    tone: CmsToastTone,
    title: string,
    descriptionOrOpts?: string | ToastOptions
  ) => string;
  success: (title: string, descriptionOrOpts?: string | ToastOptions) => string;
  error: (title: string, descriptionOrOpts?: string | ToastOptions) => string;
  warning: (title: string, descriptionOrOpts?: string | ToastOptions) => string;
  info: (title: string, descriptionOrOpts?: string | ToastOptions) => string;
  update: (
    id: string,
    title: string,
    descriptionOrOpts?: string | ToastOptions
  ) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const CmsNotifyContext = createContext<CmsNotifyApi | null>(null);

let toastSeq = 0;

function parseOpts(descriptionOrOpts?: string | ToastOptions): {
  description?: string;
  duration: number;
} {
  if (typeof descriptionOrOpts === "string") {
    return { description: descriptionOrOpts, duration: DEFAULT_TOAST_MS };
  }
  return {
    description: descriptionOrOpts?.description,
    duration: descriptionOrOpts?.duration ?? DEFAULT_TOAST_MS,
  };
}

export function CmsNotifyProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOptions;
    resolve: (ok: boolean) => void;
  } | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (
      tone: CmsToastTone,
      title: string,
      descriptionOrOpts?: string | ToastOptions
    ) => {
      const id = `t_${++toastSeq}_${Date.now().toString(36)}`;
      const { description, duration } = parseOpts(descriptionOrOpts);
      setToasts((prev) => [
        ...prev.slice(-3),
        { id, tone, title, description, duration },
      ]);
      return id;
    },
    []
  );

  const update = useCallback(
    (
      id: string,
      title: string,
      descriptionOrOpts?: string | ToastOptions
    ) => {
      const { description, duration } = parseOpts(descriptionOrOpts);
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                title,
                description,
                duration: descriptionOrOpts ? duration : t.duration,
              }
            : t
        )
      );
    },
    []
  );

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ opts, resolve });
    });
  }, []);

  const api = useMemo<CmsNotifyApi>(
    () => ({
      toast,
      success: (title, opts) => toast("success", title, opts),
      error: (title, opts) => toast("error", title, opts),
      warning: (title, opts) => toast("warning", title, opts),
      info: (title, opts) => toast("info", title, opts),
      update,
      confirm,
    }),
    [confirm, toast, update]
  );

  function closeConfirm(ok: boolean) {
    confirmState?.resolve(ok);
    setConfirmState(null);
  }

  const danger = Boolean(confirmState?.opts.danger);
  const Icon = danger ? AlertTriangle : HelpCircle;

  return (
    <CmsNotifyContext.Provider value={api}>
      {children}
      <div className="cms-toast-host" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className="cms-toast-slot" data-tone={item.tone}>
            <Toast
              title={item.title}
              description={item.description}
              duration={item.duration}
              open
              onOpenChange={(open) => {
                if (!open) dismiss(item.id);
              }}
            />
          </div>
        ))}
      </div>

      <AlertDialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open) closeConfirm(false);
        }}
      >
        <AlertDialogContent
          className={cn("cms-confirm", danger && "is-danger")}
          size="sm"
        >
          <div className="cms-confirm__icon" aria-hidden>
            <Icon className="cms-confirm__glyph" strokeWidth={1.6} />
          </div>

          <AlertDialogHeader className="cms-confirm__header">
            <AlertDialogTitle className="cms-confirm__title">
              {confirmState?.opts.title || "Are you sure?"}
            </AlertDialogTitle>
            {confirmState?.opts.description ? (
              <AlertDialogDescription className="cms-confirm__desc">
                {confirmState.opts.description}
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription className="sr-only">
                Confirm this action
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          <AlertDialogFooter className="cms-confirm__footer">
            <AlertDialogCancel className="cms-confirm__btn cms-confirm__btn--ghost">
              {confirmState?.opts.cancelLabel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "cms-confirm__btn",
                danger ? "cms-confirm__btn--danger" : "cms-confirm__btn--ok"
              )}
              onClick={() => closeConfirm(true)}
            >
              {confirmState?.opts.confirmLabel || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CmsNotifyContext.Provider>
  );
}

export function useCmsNotify(): CmsNotifyApi {
  const ctx = useContext(CmsNotifyContext);
  if (!ctx) {
    return {
      toast: () => "",
      success: () => "",
      error: () => "",
      warning: () => "",
      info: () => "",
      update: () => undefined,
      confirm: async () => false,
    };
  }
  return ctx;
}
