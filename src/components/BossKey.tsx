import { useState, useEffect, useCallback } from 'react'

const FAKE_ROWS = [
  ['Q1 Revenue', '$124,500', '$118,200', '+5.3%', 'Ahead', '✓'],
  ['Q2 Revenue', '$138,700', '$130,000', '+6.7%', 'Ahead', '✓'],
  ['Q3 Revenue', '$142,300', '$145,000', '-1.9%', 'Behind', '⚠'],
  ['Q4 Forecast', '$155,000', '$150,000', '+3.3%', 'On Track', '→'],
  ['COGS', '$67,200', '$70,000', '-4.0%', 'Favorable', '✓'],
  ['Gross Margin', '52.8%', '51.2%', '+1.6pp', 'Ahead', '✓'],
  ['Operating Exp', '$38,400', '$36,000', '+6.7%', 'Over Budget', '⚠'],
  ['EBITDA', '$36,700', '$34,200', '+7.3%', 'Ahead', '✓'],
  ['Headcount', '142', '140', '+1.4%', 'On Plan', '✓'],
  ['Burn Rate', '$2.1M', '$2.0M', '+5.0%', 'Monitor', '⚠'],
  ['ARR', '$1.87M', '$1.75M', '+6.9%', 'Ahead', '✓'],
  ['Churn Rate', '2.1%', '2.5%', '-0.4pp', 'Favorable', '✓'],
  ['NPS Score', '72', '68', '+4', 'Ahead', '✓'],
  ['CAC', '$284', '$300', '-5.3%', 'Favorable', '✓'],
  ['LTV', '$3,420', '$3,100', '+10.3%', 'Ahead', '✓'],
  ['LTV/CAC', '12.0x', '10.3x', '+1.7x', 'Ahead', '✓'],
  ['Support Tickets', '1,204', '1,100', '+9.5%', 'Over', '⚠'],
  ['Avg Resolution', '4.2h', '5.0h', '-16%', 'Favorable', '✓'],
  ['Uptime SLA', '99.97%', '99.9%', '+0.07pp', 'Met', '✓'],
  ['Deploy Freq', '18/wk', '12/wk', '+50%', 'Ahead', '✓'],
]

const CELL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export default function BossKey() {
  const [active, setActive] = useState(false)
  const [selectedCell, setSelectedCell] = useState<string>('B3')

  const toggle = useCallback(() => setActive(v => !v), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active) setActive(false)
      // Ctrl+Shift+W = boss key shortcut
      if (e.ctrlKey && e.shiftKey && e.key === 'W') { e.preventDefault(); toggle() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, toggle])

  return (
    <>
      {/* Panic button — bottom-left, looks like a subtle work icon */}
      <button
        onClick={toggle}
        title="Boss Key (Ctrl+Shift+W)"
        className="hidden md:flex fixed bottom-6 left-4 z-[90] w-11 h-11 rounded-xl bg-zinc-800/90 border border-zinc-600/50 hover:bg-zinc-700 text-zinc-300 hover:text-white shadow-xl backdrop-blur-sm items-center justify-center transition-all hover:scale-105 active:scale-95 group"
        style={{ fontSize: '18px' }}
      >
        📊
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-[10px] text-zinc-400 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Boss Key
        </span>
      </button>

      {/* Fake Google Sheets overlay */}
      {active && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-white text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Google Sheets chrome */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-b border-gray-200">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded" style={{ background: 'linear-gradient(135deg,#34a853,#0d652d)' }}>
                <svg viewBox="0 0 24 24" className="w-7 h-7 p-1" fill="white">
                  <rect x="4" y="2" width="16" height="20" rx="1" fill="white" opacity="0.2"/>
                  <path d="M14 2v6h6" fill="none" stroke="white" strokeWidth="1.5"/>
                  <path d="M14 2l6 6v14a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" fill="none" stroke="white" strokeWidth="1.5"/>
                  <line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="1.2"/>
                  <line x1="8" y1="16" x2="16" y2="16" stroke="white" strokeWidth="1.2"/>
                  <line x1="8" y1="10" x2="11" y2="10" stroke="white" strokeWidth="1.2"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 leading-tight">Q3 Financial Review — Final.xlsx</div>
                <div className="text-[10px] text-gray-400">Google Sheets</div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="px-3 py-1 text-xs text-gray-600 rounded hover:bg-gray-100">Share</button>
              <div className="w-7 h-7 rounded-full bg-blue-500 grid place-items-center text-white text-xs font-bold">S</div>
              <button
                onClick={() => setActive(false)}
                className="ml-1 p-1 rounded hover:bg-gray-100 text-gray-500"
              >✕</button>
            </div>
          </div>

          {/* Menu bar */}
          <div className="flex items-center gap-4 px-3 py-0.5 text-xs text-gray-600 border-b border-gray-100 bg-white">
            {['File','Edit','View','Insert','Format','Data','Tools','Extensions','Help'].map(m => (
              <span key={m} className="cursor-pointer hover:bg-gray-100 px-1.5 py-0.5 rounded">{m}</span>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#f8f9fa] border-b border-gray-200 text-xs text-gray-600">
            <div className="flex items-center gap-1 mr-2">
              <span className="border border-gray-300 rounded px-2 py-0.5 bg-white text-gray-700 text-[11px] w-16 text-center">{selectedCell}</span>
              <span className="text-gray-400 mx-1">fx</span>
              <span className="border border-gray-300 rounded px-2 py-0.5 bg-white text-gray-700 text-[11px] w-40">
                {selectedCell === 'B3' ? '=SUM(B2:B4)*0.95' : ''}
              </span>
            </div>
            {['↩','↪','🖨','💾','🔍'].map(i=>(
              <span key={i} className="cursor-pointer hover:bg-gray-200 p-1 rounded">{i}</span>
            ))}
            <span className="border-l border-gray-300 mx-1 h-4"/>
            {['B','I','U','S'].map(i=>(
              <span key={i} className={`cursor-pointer hover:bg-gray-200 px-1.5 py-0.5 rounded font-${i==='B'?'bold':'normal'}`}>{i}</span>
            ))}
            <span className="border-l border-gray-300 mx-1 h-4"/>
            <span className="cursor-pointer hover:bg-gray-200 px-1 rounded">$ %</span>
          </div>

          {/* Sheet */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 32 }}/>
                {CELL_LETTERS.map(l => <col key={l} style={{ width: l === 'A' ? 160 : 110 }}/>)}
              </colgroup>
              <thead>
                <tr>
                  <th className="bg-[#f8f9fa] border border-gray-200 text-gray-400 text-center sticky top-0"/>
                  {CELL_LETTERS.map(l => (
                    <th key={l} className="bg-[#f8f9fa] border border-gray-200 text-gray-500 text-center font-normal py-0.5 sticky top-0">{l}</th>
                  ))}
                </tr>
                <tr className="bg-[#e8f5e9]">
                  <td className="bg-[#f8f9fa] border border-gray-200 text-gray-400 text-center text-[10px] py-1">1</td>
                  <td className="border border-gray-200 font-bold text-gray-700 px-2 py-1">METRIC</td>
                  <td className="border border-gray-200 font-bold text-gray-700 px-2 py-1">ACTUAL</td>
                  <td className="border border-gray-200 font-bold text-gray-700 px-2 py-1">TARGET</td>
                  <td className="border border-gray-200 font-bold text-gray-700 px-2 py-1">VARIANCE</td>
                  <td className="border border-gray-200 font-bold text-gray-700 px-2 py-1">STATUS</td>
                  <td className="border border-gray-200 font-bold text-gray-700 px-2 py-1">FLAG</td>
                  <td className="border border-gray-200 px-2 py-1"/>
                  <td className="border border-gray-200 px-2 py-1"/>
                </tr>
              </thead>
              <tbody>
                {FAKE_ROWS.map((row, i) => {
                  const rowNum = i + 2
                  const statusColor = row[4] === 'Ahead' || row[4] === 'Favorable' || row[4] === 'Met'
                    ? '#e6f4ea' : row[4] === 'Behind' || row[4] === 'Over Budget' || row[4] === 'Over'
                    ? '#fce8e6' : '#fff3e0'
                  return (
                    <tr key={i} className="hover:bg-blue-50/40">
                      <td className="bg-[#f8f9fa] border border-gray-200 text-gray-400 text-center text-[10px] py-0.5">{rowNum}</td>
                      {row.map((cell, j) => {
                        const cellId = `${CELL_LETTERS[j]}${rowNum}`
                        return (
                          <td
                            key={j}
                            onClick={() => setSelectedCell(cellId)}
                            className={`border border-gray-200 px-2 py-0.5 cursor-cell ${selectedCell === cellId ? 'outline outline-2 outline-blue-500 outline-offset-[-2px] bg-blue-50' : ''}`}
                            style={{ background: j === 4 ? statusColor : undefined }}
                          >
                            {cell}
                          </td>
                        )
                      })}
                      <td className="border border-gray-200 px-2 py-0.5"/>
                      <td className="border border-gray-200 px-2 py-0.5"/>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Sheet tabs */}
          <div className="flex items-center gap-0 px-2 py-1 bg-[#f8f9fa] border-t border-gray-200 text-xs">
            {['Q3 Review','Budget 2026','Headcount','OKRs'].map((s,i) => (
              <div key={s} className={`px-4 py-1 border border-b-0 border-gray-300 rounded-t cursor-pointer mr-0.5 ${i===0?'bg-white font-medium text-green-700':'bg-[#efefef] text-gray-500 hover:bg-gray-100'}`}>{s}</div>
            ))}
            <button className="ml-2 text-gray-400 hover:text-gray-600 px-2">＋</button>
            <div className="ml-auto text-[10px] text-gray-400">Press ESC or Ctrl+Shift+W to exit · Saved 2 mins ago</div>
          </div>
        </div>
      )}
    </>
  )
}
