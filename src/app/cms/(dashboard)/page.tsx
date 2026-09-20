import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getTrafficSummary } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { requireCmsSession } from "@/lib/session";

export const metadata = {
  title: "CMS",
};

type ProjectStats = {
  total: number;
  published: number;
  selected: number;
  limited: number;
};

function displayName(email: string) {
  const local = email.split("@")[0] ?? "Studio";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5.5v13M5.5 12h13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 8.5h15v9.5a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 9.5V7.2A1.7 1.7 0 0 1 6.2 5.5h3.1L11 7.5h6.8A1.7 1.7 0 0 1 19.5 9.2V9.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5 4.8 7v5.2c0 4.4 3 8.1 7.2 9.3 4.2-1.2 7.2-4.9 7.2-9.3V7L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 12h15M12 4.5c2.5 2.6 2.5 12.4 0 15M12 4.5c-2.5 2.6-2.5 12.4 0 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4.5h7.2L18.5 9v10.5A1.5 1.5 0 0 1 17 21H7a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 7 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 4.5V9h4.5M8.5 13h7M8.5 16.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m12 4.5 8 4.2-8 4.3-8-4.3 8-4.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m4 13.2 8 4.3 8-4.3M4 17.2l8 4.3 8-4.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Glass({
  children,
  className = "",
  aurora,
}: {
  children: ReactNode;
  className?: string;
  aurora?: "green" | "coral" | "violet" | "pink" | "cyan";
}) {
  const base = aurora ? `ft-aurora is-${aurora}` : "ft-glass";
  return (
    <article className={`${base}${className ? ` ${className}` : ""}`}>
      {children}
    </article>
  );
}

function Row({
  icon,
  title,
  subtitle,
  value,
  meta,
  valueTone,
  href,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  value: string;
  meta: string;
  valueTone?: "in" | "out";
  href?: string;
}) {
  const inner = (
    <>
      <div className="ft-row-left">
        <span className="ft-avatar" aria-hidden>
          {icon}
        </span>
        <div>
          <p className="ft-row-title">{title}</p>
          <p className="ft-row-sub">{subtitle}</p>
        </div>
      </div>
      <div className="ft-row-right">
        <p className={`ft-row-value${valueTone ? ` is-${valueTone}` : ""}`}>
          {value}
        </p>
        <p className="ft-row-sub">{meta}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="ft-row is-link">
        {inner}
      </Link>
    );
  }

  return <div className="ft-row">{inner}</div>;
}

function chartFromTraffic(last7: { visitors: number }[]) {
  const max = Math.max(...last7.map((d) => d.visitors), 1);
  return last7.map((d) => Math.round(18 + (d.visitors / max) * 72));
}

export default async function CmsHomePage() {
  const session = await requireCmsSession();
  const [statRows, passkeyCount, draftsList, traffic] = await Promise.all([
    prisma.$queryRaw<ProjectStats[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE published)::int AS published,
        COUNT(*) FILTER (WHERE visibility = 'PUBLIC')::int AS selected,
        COUNT(*) FILTER (WHERE visibility = 'CONFIDENTIAL')::int AS limited
      FROM project
    `,
    prisma.passkey.count(),
    prisma.$queryRaw<
      { title: string; visibility: string; slug: string }[]
    >`
      SELECT title, visibility::text AS visibility, slug
      FROM project
      WHERE published = false
      ORDER BY "updatedAt" DESC, "createdAt" DESC
      LIMIT 4
    `,
    getTrafficSummary(),
  ]);

  const stats = statRows[0] ?? {
    total: 0,
    published: 0,
    selected: 0,
    limited: 0,
  };

  const drafts = Math.max(0, stats.total - stats.published);
  const publishRate =
    stats.total === 0 ? 0 : Math.round((stats.published / stats.total) * 100);
  const name = displayName(session.user.email);
  const initial = name.slice(0, 1).toUpperCase();
  const rateLabel =
    publishRate >= 80 ? "On track" : publishRate >= 40 ? "In progress" : "Needs work";
  const chartBars = chartFromTraffic(traffic.last7);
  const hotBar = chartBars.indexOf(Math.max(...chartBars));
  const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const weekdayLabels = traffic.last7.map((d) => {
    const day = new Date(`${d.day}T00:00:00.000Z`).getUTCDay();
    return weekLabels[day === 0 ? 6 : day - 1] ?? "·";
  });

  const draftRows =
    draftsList.length > 0
      ? draftsList.map((p) => ({
          icon: <IconDoc />,
          title: p.title,
          subtitle:
            p.visibility === "PUBLIC"
              ? "Selected · will show 2-col"
              : "Limited · will show 1-row",
          value: "Draft",
          meta: "Unpublished",
          valueTone: "out" as const,
          href: "/cms/projects",
        }))
      : [
          {
            icon: <IconPlus />,
            title: stats.total === 0 ? "No projects yet" : "Queue is clear",
            subtitle:
              stats.total === 0
                ? "Add a project to show on the portfolio"
                : "Every project is already live on the site",
            value: stats.total === 0 ? "—" : "0",
            meta: stats.total === 0 ? "Start" : "Done",
            valueTone: (stats.total === 0 ? undefined : "in") as "in" | undefined,
            href: "/cms/projects",
          },
        ];

  const glanceRows = [
    {
      icon: <IconLayers />,
      title: "Selected",
      subtitle: "2-col homepage featured",
      value: String(stats.selected),
      meta: "Layout",
      href: "/cms/projects",
    },
    {
      icon: <IconDoc />,
      title: "Limited",
      subtitle: "1-row teaser strip",
      value: String(stats.limited),
      meta: "Layout",
      href: "/cms/projects",
    },
    {
      icon: <IconShield />,
      title: "Passkeys",
      subtitle: "Devices that can sign in",
      value: String(passkeyCount),
      meta: passkeyCount > 0 ? "Ready" : "None",
      href: "/cms/settings",
    },
  ];

  return (
    <div className="ft-dash">
      <header className="ft-topbar">
        <div className="ft-brand">
          <span className="ft-logo" aria-hidden>
            s
          </span>
          <div>
            <p className="ft-brand-name">shiftboi</p>
            <p className="ft-brand-sub">Portfolio CMS</p>
          </div>
        </div>

        <Link href="/cms/projects" className="ft-search" aria-label="Open projects">
          <IconSearch />
          <span>Search projects…</span>
        </Link>

        <div className="ft-top-actions">
          <Link href="/cms/settings" className="ft-icon-btn" aria-label="Passkeys">
            <IconShield />
            {passkeyCount === 0 ? <span className="ft-dot" aria-hidden /> : null}
          </Link>
          <span className="ft-user" aria-hidden>
            {initial}
          </span>
        </div>
      </header>

      <div className="ft-bento">
        <Glass className="ft-balance" aurora="green">
          <p className="ft-label">Publish rate</p>
          <p className="ft-amount">
            {publishRate}
            <span className="ft-amount-unit">%</span>
          </p>
          <p className="ft-hint">
            {stats.published}/{stats.total || 0} projects live · {rateLabel}
          </p>

          <div className="ft-quick">
            <p className="ft-label">Quick Actions</p>
            <div className="ft-quick-row">
              <Link href="/cms/projects" className="ft-quick-btn">
                <span className="ft-quick-ico" aria-hidden>
                  <IconPlus />
                </span>
                Add
              </Link>
              <Link href="/cms/projects" className="ft-quick-btn">
                <span className="ft-quick-ico" aria-hidden>
                  <IconFolder />
                </span>
                Projects
              </Link>
              <Link href="/cms/settings" className="ft-quick-btn">
                <span className="ft-quick-ico" aria-hidden>
                  <IconShield />
                </span>
                Passkeys
              </Link>
              <Link href="/" className="ft-quick-btn">
                <span className="ft-quick-ico" aria-hidden>
                  <IconGlobe />
                </span>
                Site
              </Link>
            </div>
          </div>
        </Glass>

        <Glass className="ft-stat ft-revenue" aurora="coral">
          <p className="ft-label">Published</p>
          <p className="ft-stat-num">{stats.published}</p>
          <span className={`ft-pill${stats.published > 0 ? " is-up" : ""}`}>
            {stats.published > 0 ? "Live" : "None"}
          </span>
        </Glass>

        <Glass className="ft-stat ft-expense" aurora="violet">
          <p className="ft-label">Selected · 2-col</p>
          <p className="ft-stat-num">{stats.selected}</p>
          <span className="ft-pill">Homepage</span>
        </Glass>

        <Glass className="ft-activity" aurora="cyan">
          <div className="ft-card-head">
            <div>
              <p className="ft-label">Site visitors</p>
              <p className="ft-stat-num is-sm">{traffic.todayVisitors}</p>
            </div>
            <span className="ft-muted">Today</span>
          </div>
          <p className="ft-hint">
            {traffic.todayViews} views today · {traffic.totalVisitors} all-time
          </p>
          <div className="ft-chart" aria-hidden>
            {chartBars.map((h, i) => (
              <span
                key={traffic.last7[i]?.day ?? i}
                className={`ft-bar${i === hotBar ? " is-hot" : ""}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="ft-chart-axis" aria-hidden>
            {weekdayLabels.map((label, i) => (
              <span key={`${label}-${i}`}>{label}</span>
            ))}
          </div>
        </Glass>

        <Glass className="ft-list ft-tx">
          <div className="ft-card-head">
            <h2 className="ft-card-title">Needs publish</h2>
            <Link href="/cms/projects" className="ft-link">
              {drafts > 0 ? `${drafts} drafts` : "Projects"}
            </Link>
          </div>
          <div className="ft-stack">
            {draftRows.map((t) => (
              <Row key={t.title} {...t} />
            ))}
          </div>
        </Glass>

        <Glass className="ft-list ft-pay">
          <div className="ft-card-head">
            <h2 className="ft-card-title">Homepage layout</h2>
            <span className="ft-muted">{stats.total} total</span>
          </div>
          <div className="ft-stack">
            {glanceRows.map((p) => (
              <Row key={p.title} {...p} />
            ))}
          </div>
        </Glass>

        <Glass className="ft-send">
          <p className="ft-label">Manage portfolio</p>
          <div className="ft-recipient">
            <span className="ft-avatar is-lg ft-avatar-photo" aria-hidden>
              <Image
                src="/images/cms/mypic.jpg"
                alt=""
                width={48}
                height={48}
                className="ft-avatar-img"
              />
            </span>
            <div>
              <p className="ft-row-title">{name}</p>
              <p className="ft-row-sub">{session.user.email}</p>
            </div>
          </div>

          <div className="ft-field ft-aurora-chip is-pink">
            <span>Limited teasers</span>
            <div className="ft-amount-input">
              <strong>{stats.limited}</strong>
              <span>1-row</span>
            </div>
          </div>

          <p className="ft-hint">
            {drafts > 0
              ? `${drafts} draft${drafts === 1 ? "" : "s"} waiting to publish`
              : "All projects are published"}
          </p>

          <Link href="/cms/projects" className="ft-primary">
            Open projects
          </Link>

          <div className="ft-id-card" aria-label="Studio ID">
            <div className="ft-id-photo-wrap">
              <Image
                src="/images/cms/mypic.jpg"
                alt={name}
                width={112}
                height={140}
                className="ft-id-photo"
                priority
              />
            </div>
            <div className="ft-id-body">
              <p className="ft-id-brand">shiftboi</p>
              <p className="ft-id-name">{name}</p>
              <p className="ft-id-role">Studio admin</p>
              <div className="ft-id-meta">
                <div>
                  <p className="ft-id-mini">Email</p>
                  <p className="ft-id-value">{session.user.email}</p>
                </div>
                <div>
                  <p className="ft-id-mini">Status</p>
                  <p className="ft-id-value">Live</p>
                </div>
              </div>
            </div>
          </div>
        </Glass>
      </div>
    </div>
  );
}
