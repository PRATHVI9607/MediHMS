import { useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, MySQL } from '@codemirror/lang-sql';
import { EditorView, keymap } from '@codemirror/view';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Eraser,
  DownloadSimple,
  Copy,
  Table as TableIcon,
  Database,
  Lightning,
  WarningCircle,
  ClockCounterClockwise,
} from '@phosphor-icons/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useRunQuery, useSchema } from '@/hooks/useSqlQuery';
import { toast } from '@/components/ui/Toaster';
import { downloadCsv } from '@/lib/utils';

const PRESETS: { label: string; sql: string }[] = [
  { label: 'All Appointments (Full Join)', sql: `SELECT a.appointment_id, p.name AS patient, doc.name AS doctor,\n       dept.department_name, a.appointment_date, a.status,\n       ad.consultation_fee, ad.remarks\nFROM APPOINTMENT a\nJOIN PATIENT p   ON a.patient_id = p.patient_id\nJOIN DOCTOR doc  ON a.doctor_id  = doc.doctor_id\nJOIN DEPARTMENT dept ON doc.department_id = dept.department_id\nLEFT JOIN APPOINTMENT_DETAIL ad ON a.appointment_id = ad.appointment_id\nORDER BY a.appointment_date DESC;` },
  { label: 'Revenue by Department', sql: `SELECT dept.department_name, SUM(ad.consultation_fee) AS total_revenue\nFROM APPOINTMENT_DETAIL ad\nJOIN APPOINTMENT a ON ad.appointment_id = a.appointment_id\nJOIN DOCTOR doc ON a.doctor_id = doc.doctor_id\nJOIN DEPARTMENT dept ON doc.department_id = dept.department_id\nGROUP BY dept.department_name\nORDER BY total_revenue DESC;` },
  { label: 'Status Distribution', sql: `SELECT status, COUNT(*) AS count\nFROM APPOINTMENT\nGROUP BY status;` },
  { label: 'Top 5 Busiest Doctors', sql: `SELECT doc.name, doc.specialization, COUNT(a.appointment_id) AS total_appointments\nFROM DOCTOR doc\nLEFT JOIN APPOINTMENT a ON doc.doctor_id = a.doctor_id\nGROUP BY doc.doctor_id\nORDER BY total_appointments DESC\nLIMIT 5;` },
  { label: 'Patients w/o Appointments', sql: `SELECT * FROM PATIENT\nWHERE patient_id NOT IN (SELECT patient_id FROM APPOINTMENT);` },
];

const HISTORY_KEY = 'medivault-sql-history';
const loadHistory = (): string[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
};

const cmTheme = EditorView.theme({
  '&': { fontSize: '13.5px', backgroundColor: 'transparent' },
  '.cm-content': { fontFamily: '"JetBrains Mono", monospace', caretColor: '#9A7A2E' },
  '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: '#A08C6E' },
  '.cm-activeLine': { backgroundColor: 'rgba(201,168,76,0.06)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(201,168,76,0.08)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'rgba(232,208,128,0.45) !important' },
});

export function QueryConsole() {
  const [code, setCode] = useState(PRESETS[0].sql);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const run = useRunQuery();
  const { data: schema } = useSchema();
  const result = run.data;

  const onChange = useCallback((v: string) => setCode(v), []);

  const execute = () => {
    if (!code.trim()) return;
    run.mutate(code, {
      onSuccess: (r) => {
        const next = [code, ...history.filter((h) => h !== code)].slice(0, 10);
        setHistory(next);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        if (r.type === 'write') toast.success(`${r.affectedRows ?? 0} row(s) affected`);
      },
    });
  };

  const copyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.rows, null, 2));
    toast.success('Copied JSON to clipboard');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Power Tools"
        title="SQL Console"
        description="Query the database directly. SELECT is open to all roles; DML requires Admin."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        {/* Editor + results */}
        <div className="space-y-4">
          <Card bodyClassName="p-0">
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 border-b border-line/60 px-4 py-3">
              <Lightning size={16} weight="fill" className="text-gold-dark" />
              <span className="mr-1 text-xs font-bold uppercase tracking-wider text-ink-muted">Quick queries</span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setCode(p.sql)}
                  className="rounded-pill border border-line bg-surface-base px-3 py-1 text-xs font-semibold text-ink-secondary transition-colors hover:border-gold hover:text-gold-dark"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Editor */}
            <div className="bg-surface-base/60">
              <CodeMirror
                value={code}
                height="220px"
                theme={cmTheme}
                extensions={[
                  sql({ dialect: MySQL, upperCaseKeywords: true }),
                  keymap.of([{ key: 'Mod-Enter', run: () => { execute(); return true; } }]),
                ]}
                onChange={onChange}
                basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
              />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between border-t border-line/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <Button size="sm" icon={<Play size={15} weight="fill" />} onClick={execute} loading={run.isPending}>Run</Button>
                <Button size="sm" variant="ghost" icon={<Eraser size={15} />} onClick={() => setCode('')}>Clear</Button>
              </div>
              <kbd className="hidden rounded-sm border border-line bg-surface-overlay px-2 py-0.5 font-mono text-[11px] text-ink-muted sm:inline">⌘/Ctrl + Enter to run</kbd>
            </div>
          </Card>

          {/* Error */}
          <AnimatePresence>
            {run.isError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-start gap-3 rounded-md border border-status-error/30 bg-status-error/8 px-4 py-3">
                  <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-status-error" />
                  <div>
                    <p className="text-sm font-semibold text-status-error">{(run.error as any)?.code ?? 'SQL_ERROR'}</p>
                    <p className="font-mono text-xs text-ink-secondary">{(run.error as any)?.message}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          {result && !run.isError && (
            <Card bodyClassName="p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 px-4 py-3">
                <div className="flex items-center gap-3 text-sm">
                  <TableIcon size={16} className="text-gold-dark" />
                  <span className="font-semibold text-ink">{result.rowCount} {result.type === 'write' ? 'affected' : 'rows'}</span>
                  <Badge tone="sky">{result.executionTime} ms</Badge>
                </div>
                {result.rows.length > 0 && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" icon={<DownloadSimple size={14} />} onClick={() => downloadCsv('query-result.csv', result.rows, result.columns)}>CSV</Button>
                    <Button size="sm" variant="secondary" icon={<Copy size={14} />} onClick={copyJson}>JSON</Button>
                  </div>
                )}
              </div>
              {result.rows.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-ink-muted">Query ran successfully — no rows returned.</p>
              ) : (
                <div className="max-h-[420px] overflow-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0">
                      <tr className="bg-surface-overlay/90 backdrop-blur">
                        {result.columns.map((c) => (
                          <th key={c} className="whitespace-nowrap border-b border-line px-4 py-2.5 text-left font-mono text-xs font-bold text-gold-dark">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i} className="border-b border-line/40 hover:bg-gold-light/10">
                          {result.columns.map((c) => (
                            <td key={c} className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-ink">
                              {row[c] === null ? <span className="italic text-ink-muted">NULL</span> : String(row[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar: schema + history */}
        <div className="space-y-4">
          <Card bodyClassName="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Database size={16} weight="fill" className="text-sky-dark" />
              <h3 className="text-sm font-semibold text-ink">Schema</h3>
            </div>
            <div className="space-y-3">
              {schema?.map((t) => (
                <details key={t.table} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-sm px-2 py-1.5 font-mono text-xs font-semibold text-ink hover:bg-surface-overlay">
                    {t.table}
                    <span className="text-[10px] text-ink-muted">{t.columns.length}</span>
                  </summary>
                  <ul className="ml-2 mt-1 space-y-0.5 border-l border-line pl-3">
                    {t.columns.map((c) => (
                      <li key={c.name} className="flex items-center justify-between py-0.5 font-mono text-[11px]">
                        <button onClick={() => setCode((s) => s + c.name)} className="text-ink-secondary hover:text-gold-dark">{c.name}</button>
                        <span className="text-ink-muted">{c.type}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </Card>

          {history.length > 0 && (
            <Card bodyClassName="p-4">
              <div className="mb-3 flex items-center gap-2">
                <ClockCounterClockwise size={16} weight="fill" className="text-gold-dark" />
                <h3 className="text-sm font-semibold text-ink">History</h3>
              </div>
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setCode(h)}
                    className="block w-full truncate rounded-sm px-2 py-1.5 text-left font-mono text-[11px] text-ink-secondary transition-colors hover:bg-surface-overlay hover:text-ink"
                    title={h}
                  >
                    {h.replace(/\s+/g, ' ').slice(0, 48)}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
