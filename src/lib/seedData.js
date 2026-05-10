let _n = 1
const uid = () => `seed-${_n++}`
const t = (date, type, category, amount, note = '') => ({ id: uid(), date, type, category, amount, note })

const ALL_MONTHS = [
  '2025-03', '2025-04', '2025-05', '2025-06', '2025-07',
  '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
  '2026-02', '2026-03', '2026-04',
]

const income = [
  t('2026-04-15', 'income', 'Hexenhof', 602.08, 'April salary'),
  t('2026-03-15', 'income', 'Lumileds', 2061.21, 'March salary'),
  t('2026-03-15', 'income', 'Hexenhof', 598.00, 'March salary'),
  t('2026-02-15', 'income', 'Lumileds', 782.11, 'February salary'),
  t('2026-02-15', 'income', 'Hexenhof', 601.25, 'February salary'),
  t('2025-12-15', 'income', 'Lumileds', 1205.00, 'December salary'),
  t('2025-12-15', 'income', 'Hexenhof', 555.75, 'December salary'),
  t('2025-11-15', 'income', 'Lumileds', 922.06, 'November salary'),
  t('2025-11-15', 'income', 'Hexenhof', 552.50, 'November salary'),
  t('2025-10-15', 'income', 'Lumileds', 1141.92, 'October salary'),
  t('2025-10-15', 'income', 'Hexenhof', 552.50, 'October salary'),
  t('2025-09-15', 'income', 'Lumileds', 1009.78, 'September salary'),
  t('2025-09-15', 'income', 'Hexenhof', 555.75, 'September salary'),
  t('2025-08-15', 'income', 'Lumileds', 793.25, 'August salary'),
  t('2025-08-15', 'income', 'Hexenhof', 552.50, 'August salary'),
  t('2025-07-15', 'income', 'Hexenhof', 552.00, 'July salary'),
  t('2025-06-15', 'income', 'Hexenhof', 601.25, 'June salary'),
  t('2025-05-15', 'income', 'Hexenhof', 555.75, 'May salary'),
  t('2025-04-15', 'income', 'Hexenhof', 552.50, 'April salary'),
  t('2025-04-15', 'income', 'Other', 459.00, 'Paper (prev job)'),
  t('2025-03-15', 'income', 'Hexenhof', 552.00, 'March salary'),
  t('2025-03-15', 'income', 'Other', 307.00, 'Paper (prev job)'),
]

const fixed = ALL_MONTHS.flatMap(m => [
  t(`${m}-01`, 'expense', 'Rent', 285.00, 'Monthly rent'),
  t(`${m}-05`, 'expense', 'Insurance', 145.00, 'Monthly insurance'),
  t(`${m}-10`, 'expense', 'Phone', 52.00, 'Phone bill'),
  t(`${m}-15`, 'expense', 'Bank Fees', 3.50, 'Sparkasse fee'),
  t(`${m}-01`, 'expense', 'India Transfer', 50.00, 'Mom'),
  t(`${m}-05`, 'expense', 'Mutual Funds', 60.00, 'Monthly SIP'),
])

const oneTime = [
  t('2026-03-10', 'expense', 'Health', 52.09, 'Uniklinik'),
  t('2026-03-08', 'expense', 'Education', 358.34, 'Tuition Fee'),
  t('2026-04-10', 'expense', 'Phone', 52.39, 'Phone Bill Apr'),
  t('2025-10-10', 'expense', 'Education', 338.05, 'Semester Fee'),
  t('2025-09-10', 'expense', 'Health', 52.09, 'Uniklinik'),
  t('2025-04-10', 'expense', 'Health', 52.09, 'Uniklinik'),
  t('2025-07-20', 'expense', 'Entertainment', 20.00, 'Gift order'),
  t('2025-11-01', 'expense', 'Health', 206.92, 'Tobias Radio tax / Insurance'),
  t('2025-06-01', 'expense', 'India Transfer', 100.72, 'India (Mom + family)'),
  t('2025-05-01', 'expense', 'India Transfer', 319.90, 'Remitly India Transfer'),
]

export const SEED_TRANSACTIONS = [...income, ...fixed, ...oneTime]
export const SEED_MONTHS = ALL_MONTHS
