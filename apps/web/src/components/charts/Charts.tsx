import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ApptStatus, DashboardStats } from '@/types';
import { currency, formatDateShort } from '@/lib/utils';

const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8D080';
const SKY = '#5DB8D4';

const STATUS_COLORS: Record<ApptStatus, string> = {
  Scheduled: '#5DB8D4',
  Completed: '#4CAF6E',
  Cancelled: '#D64C4C',
  'No-Show': '#E8A23C',
};

const tooltipStyle = {
  background: '#FFFDF7',
  border: '1px solid #E2D8BE',
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(180,150,80,0.18)',
  fontSize: 13,
  color: '#2C2410',
};

export function TrendChart({ data }: { data: DashboardStats['trend'] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
            <stop offset="100%" stopColor={GOLD_LIGHT} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2D8BE" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateShort}
          tick={{ fontSize: 11, fill: '#A08C6E' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#A08C6E' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={formatDateShort} />
        <Area
          type="monotone"
          dataKey="count"
          name="Appointments"
          stroke={GOLD}
          strokeWidth={2.5}
          fill="url(#trendFill)"
          dot={{ r: 3, fill: GOLD, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: GOLD, stroke: '#FFFDF7', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data }: { data: DashboardStats['revenueByDept'] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SKY} stopOpacity={0.95} />
            <stop offset="100%" stopColor="#A8DFF0" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2D8BE" vertical={false} />
        <XAxis
          dataKey="department_name"
          tick={{ fontSize: 10, fill: '#A08C6E' }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: '#A08C6E' }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => currency(v)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [currency(v), 'Revenue']} cursor={{ fill: 'rgba(201,168,76,0.08)' }} />
        <Bar dataKey="total_revenue" name="Revenue" fill="url(#barFill)" radius={[8, 8, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({ data }: { data: DashboardStats['byStatus'] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius={56}
          outerRadius={92}
          paddingAngle={3}
          stroke="#FFFDF7"
          strokeWidth={2}
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? GOLD} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
