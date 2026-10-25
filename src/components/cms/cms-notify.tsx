"use client";

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
  duration?: number;
};

const DEFAULT_TOAST_MS = 2400;

type CmsNotifyApi = {
  toast: (
    tone: CmsToastTone,
    title: string,
    descriptionOrOpts?: string | ToastOptions,
  ) => string;
  success: (title: string, descriptionOrOpts?: string | ToastOptions) => string;
  error: (title: string, descriptionOrOpts?: string | ToastOptions) => string;
  warning: (title: string, descriptionOrOpts?: string | ToastOptions) => string;
  info: (title: string, descriptionOrOpts?: string | ToastOptions) => string;
  update: (
    id: string,
    title: string,
    descriptionOrOpts?: string | ToastOptions,
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
      descriptionOrOpts?: string | ToastOptions,
    ) => {
      const id = `t_${++toastSeq}_${Date.now().toString(36)}`;
      const { description, duration } = parseOpts(descriptionOrOpts);
      setToasts((prev) => [
        ...prev.slice(-3),
        { id, tone, title, description, duration },
      ]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const update = useCallback(
    (
      id: string,
      title: string,
      descriptionOrOpts?: string | ToastOptions,
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
            : t,
        ),
      );
    },
    [],
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
    [confirm, toast, update],
  );

  function closeConfirm(ok: boolean) {
    confirmState?.resolve(ok);
    setConfirmState(null);
  }

  const danger = Boolean(confirmState?.opts.danger);

  return (
    <CmsNotifyContext.Provider value={api}>
      {children}
      <div className="cms-toast-host" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className="cms-toast-slot" data-tone={item.tone}>
            <div className="cms-toast">
              <div className="cms-toast-body">
                <p className="cms-toast-title">{item.title}</p>
                {item.description ? (
                  <p className="cms-toast-desc">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="cms-toast-dismiss"
                aria-label="Dismiss"
                onClick={() => dismiss(item.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmState ? (
        <div className="cms-confirm-backdrop" role="presentation">
          <div
            className={`cms-confirm${danger ? " is-danger" : ""}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cms-confirm-title"
          >
            <h2 id="cms-confirm-title" className="cms-confirm-title">
              {confirmState.opts.title || "Are you sure?"}
            </h2>
            {confirmState.opts.description ? (
              <p className="cms-confirm-desc">{confirmState.opts.description}</p>
            ) : null}
            <div className="cms-confirm-footer">
              <button
                type="button"
                className="cms-btn"
                onClick={() => closeConfirm(false)}
              >
                {confirmState.opts.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                className={`cms-btn ${danger ? "is-danger" : "cms-btn-primary"}`}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.opts.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
