import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Link, useLocation, useNavigate } from '@/figma/router';
import { useDashTheme } from '@/figma/context/DashTheme';
import { ownerService, waitlistService } from '@/lib/services';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { href: '/dashboard', icon: '⬡', label: 'Overview', exact: true },
  { href: '/dashboard/jobs', icon: '◈', label: 'Jobs' },
  { href: '/dashboard/calendar', icon: '⬜', label: 'Calendar' },
  { href: '/dashboard/waitlist', icon: '◉', label: 'Waitlist' },
  { href: '/dashboard/leads', icon: '◎', label: 'Leads' },
  { href: '/dashboard/projects', icon: '▣', label: 'Projects' },
  { href: '/dashboard/inbox', icon: '◌', label: 'Inbox' },
  { href: '/dashboard/rot', icon: '◧', label: 'ROT' },
];

const bottomItems = [
  { href: '/dashboard/settings', icon: '⚙', label: 'Settings' },
];

/* Items shown in the mobile bottom tab bar */
const mobileTabItems = [
  { href: '/dashboard', icon: '⬡', label: 'Overview', exact: true },
  { href: '/dashboard/jobs', icon: '◈', label: 'Jobs' },
  { href: '/dashboard/calendar', icon: '⬜', label: 'Cal' },
  { href: '/dashboard/waitlist', icon: '◉', label: 'Wait' },
  { href: '/dashboard/inbox', icon: '◌', label: 'Inbox' },
];

function useWaitlistWaitingCount() {
  const get = useServerFn(waitlistService.get);
  const q = useQuery({ queryKey: ['waitlist'], queryFn: () => get(), refetchInterval: 15000 });
  return q.data?.entries.filter((e) => e.status === 'waiting').length ?? 0;
}

function useOwnerName() {
  const get = useServerFn(ownerService.settings);
  const q = useQuery({ queryKey: ['settings'], queryFn: () => get() });
  return q.data?.owner_name ?? 'Owner';
}

function SidebarContent({
  collapsed,
  onCollapse,
  onClose,
}: {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  onClose?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, tokens: T, toggle } = useDashTheme();
  const waitingCount = useWaitlistWaitingCount();
  const ownerName = useOwnerName();

  const isActive = (href: string, exact?: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  const handleNavClick = () => onClose?.();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: T.sidebar }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-3 gap-3 overflow-hidden flex-shrink-0"
        style={{ borderBottom: `1px solid ${T.divider}` }}>
        {collapsed ? (
          <button
            onClick={() => onCollapse(false)}
            className="w-full flex items-center justify-center opacity-40 hover:opacity-90 transition-opacity"
            style={{ color: '#22D3EE', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', height: 32 }}
            aria-label="Expand sidebar"
          >
            ›
          </button>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0891B2, #22D3EE)', boxShadow: '0 0 16px rgba(8,145,178,0.35)' }}>
              <span style={{ fontSize: 14, color: '#030E1C', fontWeight: 800, fontFamily: 'Fraunces, serif' }}>V</span>
            </div>
            <div className="animate-fade-in flex-1 min-w-0">
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: 15, color: T.text }}>VVS Flow</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Ekström VVS</div>
            </div>
            <button
              onClick={() => { onCollapse(true); onClose?.(); }}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center opacity-30 hover:opacity-80 transition-opacity"
              style={{ color: T.toggleColor, fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Collapse sidebar"
            >
              ‹
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {navItems.map(item => {
            const active = isActive(item.href, item.exact);
            const badge = item.href === '/dashboard/waitlist' && waitingCount > 0 ? String(waitingCount) : undefined;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-3 mx-2 rounded-lg transition-all duration-200 no-underline relative"
                style={{
                  padding: collapsed ? '10px 14px' : '10px 12px',
                  color: active ? T.navTextActive : T.navText,
                  background: active ? T.navActive : 'transparent',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!active) { el.style.color = T.text; el.style.background = T.navHover; }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (!active) { el.style.color = T.navText; el.style.background = 'transparent'; }
                }}
              >
                <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{item.label}</span>}
                {!collapsed && badge && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(8,145,178,0.18)', color: '#22D3EE', fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                    {badge}
                  </span>
                )}
                {active && (
                  <span className="absolute right-0 top-1/2 w-0.5 h-5 rounded-l"
                    style={{ background: 'linear-gradient(to bottom, #0891B2, #22D3EE)', transform: 'translateY(-50%)' }} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="pb-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.divider}`, paddingTop: 8 }}>
        {bottomItems.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} to={item.href} onClick={handleNavClick}
              title={collapsed ? item.label : undefined}
              className="flex items-center gap-3 mx-2 rounded-lg transition-all duration-200 no-underline"
              style={{ padding: collapsed ? '10px 14px' : '10px 12px', color: active ? T.navTextActive : T.navText, justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>}
            </Link>
          );
        })}

        {/* Theme toggle */}
        {!collapsed && (
          <button
            onClick={toggle}
            className="mx-2 mt-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
            style={{
              width: 'calc(100% - 16px)',
              background: 'transparent',
              border: `1px solid ${T.sidebarBorder}`,
              color: T.textMid,
              cursor: 'pointer',
              fontSize: 13,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.navHover}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <span style={{ fontSize: 14 }}>{theme === 'dark' ? '☀' : '☾'}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.04em' }}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>
        )}

        {collapsed && (
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="mx-auto mt-1 flex items-center justify-center rounded-lg transition-all"
            style={{ width: 40, height: 36, background: 'transparent', border: `1px solid ${T.sidebarBorder}`, color: T.textMid, cursor: 'pointer', fontSize: 14, display: 'flex' }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        )}

        {/* User card */}
        {!collapsed && (
          <div className="mx-2 mt-2 p-3 rounded-xl"
            style={{ background: T.userCard, border: `1px solid ${T.userCardBorder}` }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0891B2, #22D3EE)', color: '#030E1C' }}>
                {ownerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }} className="truncate">{ownerName}</div>
                <div style={{ fontSize: 11, color: '#0891B2', fontFamily: 'JetBrains Mono' }}>Owner</div>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
              >
                ⎋
              </button>
            </div>
          </div>
        )}

        {collapsed && (
          <button
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="mx-auto mt-2 flex items-center justify-center rounded-lg transition-all"
            style={{ width: 40, height: 32, background: 'transparent', border: `1px solid ${T.sidebarBorder}`, color: T.textDim, cursor: 'pointer', fontSize: 13, display: 'flex' }}
          >
            ⎋
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, tokens: T, toggle } = useDashTheme();

  return (
    <div className="flex min-h-screen" style={{ background: T.bg, fontFamily: 'Outfit, sans-serif' }}>

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300"
        style={{
          width: collapsed ? 64 : 240,
          borderRight: `1px solid ${T.sidebarBorder}`,
          boxShadow: theme === 'light' ? '2px 0 16px rgba(8,145,178,0.06)' : 'none',
        }}
      >
        <SidebarContent collapsed={collapsed} onCollapse={setCollapsed} />
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3"
        style={{ background: T.sidebar, borderBottom: `1px solid ${T.divider}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-all"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Open menu"
        >
          <span className="block w-5 h-0.5 rounded" style={{ background: T.text }} />
          <span className="block w-5 h-0.5 rounded" style={{ background: T.text }} />
          <span className="block w-3.5 h-0.5 rounded" style={{ background: T.textMid }} />
        </button>

        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0891B2, #22D3EE)' }}>
            <span style={{ fontSize: 12, color: '#030E1C', fontWeight: 800, fontFamily: 'Fraunces, serif' }}>V</span>
          </div>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: T.text }}>VVS Flow</span>
        </div>

        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-lg"
          style={{ background: T.navHover, border: `1px solid ${T.divider}`, color: T.textMid, cursor: 'pointer', fontSize: 15 }}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>

      {/* ── Mobile drawer overlay ───────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div
            className="relative flex flex-col w-72 h-full animate-slide-up"
            style={{ background: T.sidebar, boxShadow: '4px 0 32px rgba(0,0,0,0.25)', animationDuration: '220ms' }}
          >
            <SidebarContent collapsed={false} onCollapse={() => {}} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────── */}
      <main
        className="flex-1 overflow-auto min-h-screen"
        style={{ background: T.bg, color: T.text, paddingTop: 0 }}
      >
        {/* Spacer for mobile top bar */}
        <div className="lg:hidden h-14 flex-shrink-0" />
        {children}
        {/* Mobile bottom tab bar spacer */}
        <div className="lg:hidden h-16 flex-shrink-0" />
      </main>

      {/* ── Mobile bottom tab bar ───────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{
          height: 60,
          background: T.sidebar,
          borderTop: `1px solid ${T.divider}`,
          boxShadow: '0 -2px 16px rgba(0,0,0,0.1)',
        }}
      >
        {mobileTabItems.map(item => {
          const active = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 no-underline transition-all"
              style={{ color: active ? '#0891B2' : T.navText, height: '100%' }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {item.label}
              </span>
              {active && (
                <span
                  className="absolute top-0 rounded-b"
                  style={{ width: 24, height: 2, background: 'linear-gradient(90deg, #0891B2, #22D3EE)' }}
                />
              )}
            </Link>
          );
        })}
        {/* More button → opens drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
          style={{ color: T.navText, background: 'none', border: 'none', cursor: 'pointer', height: '100%' }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>⊞</span>
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono', letterSpacing: '0.04em', textTransform: 'uppercase' }}>More</span>
        </button>
      </nav>
    </div>
  );
}
