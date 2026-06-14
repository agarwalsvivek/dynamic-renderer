import { Manifest } from '../types';

export const PRESETS: Record<string, Manifest> = {
  funds: {
    renderType: 'table',
    title: 'Fund overview',
    data: [
      { id: 'vfiax', name: 'VFIAX', category: 'Large blend', nav: 628.68, change: 0.023, aum: 412, status: 'up', history: [598, 605, 610, 618, 622, 628] },
      { id: 'vtsax', name: 'VTSAX', category: 'Total market', nav: 132.45, change: -0.011, aum: 316, status: 'down', history: [140, 138, 137, 135, 134, 132] },
      { id: 'fxaix', name: 'FXAIX', category: 'Large blend', nav: 194.20, change: 0.018, aum: 298, status: 'up', history: [184, 187, 189, 191, 193, 194] },
      { id: 'vbtlx', name: 'VBTLX', category: 'Bond', nav: 10.82, change: -0.004, aum: 87, status: 'down', history: [11.1, 11.0, 10.9, 10.9, 10.8, 10.82] },
      { id: 'vwilx', name: 'VWILX', category: 'Intl growth', nav: 48.33, change: 0.031, aum: 64, status: 'up', history: [44, 45, 46, 47, 47, 48] },
    ],
    columns: [
      { key: 'name', label: 'Fund', type: 'text', width: 90, sortable: true, filterable: true, filterType: 'text', action: { type: 'drilldown', event: 'FUND_DETAIL' } },
      { key: 'category', label: 'Category', type: 'badge', width: 120, sortable: true, filterable: true, filterType: 'select', badgeMap: { 'Large blend': 'info', 'Total market': 'gray', 'Bond': 'warning', 'Intl growth': 'success' }, action: { type: 'filter', event: 'FILTER_CATEGORY' } },
      { key: 'nav', label: 'NAV', type: 'currency', width: 90, sortable: true, filterable: true, filterType: 'range', action: null },
      { key: 'change', label: 'Change', type: 'percent_change', width: 90, sortable: true, filterable: false, action: null },
      { key: 'aum', label: 'AUM ($B)', type: 'number', width: 85, sortable: true, filterable: true, filterType: 'range', action: null },
      { key: 'status', label: 'Trend', type: 'badge', width: 80, sortable: false, filterable: true, filterType: 'select', badgeMap: { up: 'success', down: 'danger' }, action: null },
      { key: 'history', label: '7-day', type: 'sparkline', width: 80, sortable: false, filterable: false, action: { type: 'modal', event: 'SHOW_HISTORY' } },
      { key: 'id', label: 'Action', type: 'link_btn', width: 80, label2: 'View →', sortable: false, filterable: false, action: { type: 'drilldown', event: 'OPEN_FUND' } },
    ],
  },

  sales: {
    renderType: 'chart',
    title: 'Quarterly sales by region',
    chartType: 'bar',
    xAxis: { key: 'quarter', label: 'Quarter' },
    yAxes: [
      { key: 'north', label: 'North', color: '#378ADD' },
      { key: 'south', label: 'South', color: '#1D9E75' },
      { key: 'west', label: 'West', color: '#D85A30' },
    ],
    data: [
      { quarter: 'Q1 2025', north: 420, south: 310, west: 280 },
      { quarter: 'Q2 2025', north: 510, south: 390, west: 340 },
      { quarter: 'Q3 2025', north: 480, south: 420, west: 390 },
      { quarter: 'Q4 2025', north: 620, south: 470, west: 410 },
      { quarter: 'Q1 2026', north: 540, south: 400, west: 360 },
      { quarter: 'Q2 2026', north: 590, south: 450, west: 430 },
    ],
  },

  users: {
    renderType: 'table',
    title: 'User accounts',
    data: [
      { id: 'u1', name: 'Alice Chen', role: 'Admin', score: 92, plan: 'Pro', status: 'active', joined: '2023-03-12' },
      { id: 'u2', name: 'Bob Martinez', role: 'Editor', score: 74, plan: 'Free', status: 'active', joined: '2023-07-01' },
      { id: 'u3', name: 'Carol Kim', role: 'Viewer', score: 41, plan: 'Free', status: 'inactive', joined: '2024-01-15' },
      { id: 'u4', name: 'David Osei', role: 'Admin', score: 88, plan: 'Pro', status: 'active', joined: '2022-11-20' },
      { id: 'u5', name: 'Eva Larsson', role: 'Editor', score: 63, plan: 'Team', status: 'active', joined: '2024-03-08' },
    ],
    columns: [
      { key: 'name', label: 'Name', type: 'avatar_text', width: 140, sortable: true, filterable: true, filterType: 'text', action: { type: 'drilldown', event: 'USER_PROFILE' } },
      { key: 'role', label: 'Role', type: 'badge', width: 85, sortable: true, filterable: true, filterType: 'select', badgeMap: { Admin: 'info', Editor: 'warning', Viewer: 'gray' }, action: { type: 'filter', event: 'FILTER_ROLE' } },
      { key: 'score', label: 'Health', type: 'progress', width: 120, sortable: true, filterable: true, filterType: 'range', action: null },
      { key: 'plan', label: 'Plan', type: 'badge', width: 80, sortable: true, filterable: true, filterType: 'select', badgeMap: { Pro: 'success', Team: 'info', Free: 'gray' }, action: { type: 'modal', event: 'UPGRADE_PLAN' } },
      { key: 'status', label: 'Status', type: 'badge', width: 90, sortable: true, filterable: true, filterType: 'select', badgeMap: { active: 'success', inactive: 'danger' }, action: null },
      { key: 'joined', label: 'Joined', type: 'date', width: 110, sortable: true, filterable: false, action: null },
      { key: 'id', label: '', type: 'link_btn', width: 80, label2: 'Edit →', sortable: false, filterable: false, action: { type: 'drilldown', event: 'EDIT_USER' } },
    ],
  },

  performance: {
    renderType: 'chart',
    title: 'Portfolio performance YTD',
    chartType: 'line',
    xAxis: { key: 'month', label: 'Month' },
    yAxes: [
      { key: 'portfolio', label: 'My portfolio', color: '#378ADD' },
      { key: 'sp500', label: 'S&P 500', color: '#1D9E75' },
      { key: 'bond', label: 'Bond index', color: '#D85A30' },
    ],
    data: [
      { month: 'Jan', portfolio: 100, sp500: 100, bond: 100 },
      { month: 'Feb', portfolio: 103, sp500: 102, bond: 99 },
      { month: 'Mar', portfolio: 98, sp500: 97, bond: 101 },
      { month: 'Apr', portfolio: 106, sp500: 104, bond: 100 },
      { month: 'May', portfolio: 111, sp500: 108, bond: 99 },
      { month: 'Jun', portfolio: 109, sp500: 106, bond: 100 },
    ],
  },
};
