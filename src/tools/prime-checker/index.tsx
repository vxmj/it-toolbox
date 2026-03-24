import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

function isPrime(n: number): boolean {
  if (n < 2) return false
  if (n === 2) return true
  if (n % 2 === 0) return false
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false
  }
  return true
}

function primeFactors(n: number): number[] {
  const factors: number[] = []
  let num = Math.abs(n)
  
  for (let i = 2; i <= Math.sqrt(num); i++) {
    while (num % i === 0) {
      factors.push(i)
      num /= i
    }
  }
  
  if (num > 1) {
    factors.push(num)
  }
  
  return factors
}

function generatePrimes(start: number, count: number): number[] {
  const primes: number[] = []
  let current = Math.max(2, start)
  
  while (primes.length < count && current < Number.MAX_SAFE_INTEGER) {
    if (isPrime(current)) {
      primes.push(current)
    }
    current++
  }
  
  return primes
}

function formatFactors(factors: number[]): string {
  if (factors.length === 0) return '1'
  
  const counts = new Map<number, number>()
  for (const f of factors) {
    counts.set(f, (counts.get(f) || 0) + 1)
  }
  
  return Array.from(counts.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([prime, exp]) => exp > 1 ? `${prime}^${exp}` : `${prime}`)
    .join(' × ')
}

export default function PrimeChecker() {
  const [input, setInput] = useState('97')
  const [mode, setMode] = useState<'check' | 'factors' | 'generate'>('check')
  const [generateCount, setGenerateCount] = useState(10)
  const [generateStart, setGenerateStart] = useState(1)
  const { copy, copied } = useClipboard()

  const number = useMemo(() => {
    const parsed = parseInt(input)
    return isNaN(parsed) ? null : parsed
  }, [input])

  const checkResult = useMemo(() => {
    if (number === null) return null
    return {
      isPrime: isPrime(number),
      previousPrime: number > 2 ? findPreviousPrime(number) : null,
      nextPrime: findNextPrime(number),
    }
  }, [number])

  const factorsResult = useMemo(() => {
    if (number === null || number < 1) return null
    return {
      factors: primeFactors(number),
      formatted: formatFactors(primeFactors(number)),
    }
  }, [number])

  const generatedPrimes = useMemo(() => {
    if (mode !== 'generate') return []
    return generatePrimes(generateStart, generateCount)
  }, [mode, generateStart, generateCount])

  function findPreviousPrime(n: number): number | null {
    for (let i = n - 1; i >= 2; i--) {
      if (isPrime(i)) return i
    }
    return null
  }

  function findNextPrime(n: number): number {
    let current = n + 1
    while (!isPrime(current)) {
      current++
    }
    return current
  }

  const reset = () => {
    setInput('97')
    setMode('check')
    setGenerateCount(10)
    setGenerateStart(1)
  }

  const outputValue = useMemo(() => {
    if (mode === 'check' && checkResult) {
      return checkResult.isPrime ? '是质数' : '不是质数'
    }
    if (mode === 'factors' && factorsResult) {
      return factorsResult.formatted
    }
    if (mode === 'generate') {
      return generatedPrimes.join(', ')
    }
    return ''
  }, [mode, checkResult, factorsResult, generatedPrimes])

  return (
    <ToolLayout meta={meta} onReset={reset} outputValue={outputValue}>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setMode('check')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'check'
              ? 'bg-accent text-bg-base'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
          }`}
        >
          质数检测
        </button>
        <button
          onClick={() => setMode('factors')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'factors'
              ? 'bg-accent text-bg-base'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
          }`}
        >
          质因数分解
        </button>
        <button
          onClick={() => setMode('generate')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'generate'
              ? 'bg-accent text-bg-base'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
          }`}
        >
          生成质数
        </button>
      </div>

      {mode === 'check' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
              输入数字
            </label>
            <input
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="输入要检测的数字"
              className="w-full px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary text-lg font-mono focus:outline-none focus:border-accent"
            />
          </div>

          {checkResult && number !== null && (
            <div className={`p-4 rounded-xl ${
              checkResult.isPrime
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-rose-500/10 border border-rose-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {checkResult.isPrime ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                <span className={`text-lg font-bold ${
                  checkResult.isPrime ? 'text-green-500' : 'text-rose-500'
                }`}>
                  {number} {checkResult.isPrime ? '是质数' : '不是质数'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div className="p-2 rounded-lg bg-bg-raised">
                  <span className="text-text-muted">前一个质数:</span>
                  <span className="ml-2 font-mono text-text-primary">
                    {checkResult.previousPrime ?? '无'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-bg-raised">
                  <span className="text-text-muted">后一个质数:</span>
                  <span className="ml-2 font-mono text-text-primary">
                    {checkResult.nextPrime}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'factors' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
              输入数字
            </label>
            <input
              type="number"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="输入要分解的数字"
              className="w-full px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary text-lg font-mono focus:outline-none focus:border-accent"
            />
          </div>

          {factorsResult && number !== null && number > 0 && (
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">质因数分解结果</span>
                <button
                  onClick={() => copy(factorsResult.formatted)}
                  className="p-1 rounded hover:bg-bg-raised"
                >
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-text-muted" />}
                </button>
              </div>
              <div className="text-lg font-mono text-text-primary">
                {number} = {factorsResult.formatted}
              </div>
              
              {factorsResult.factors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {factorsResult.factors.map((factor, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-accent/10 text-accent text-sm font-mono"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'generate' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
                起始数字
              </label>
              <input
                type="number"
                value={generateStart}
                onChange={e => setGenerateStart(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
                生成数量
              </label>
              <input
                type="number"
                value={generateCount}
                onChange={e => setGenerateCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-3 rounded-xl bg-bg-surface border border-border-base text-text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">生成的质数 ({generatedPrimes.length} 个)</span>
              <button
                onClick={() => copy(generatedPrimes.join(', '))}
                className="p-1 rounded hover:bg-bg-raised"
              >
                {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-text-muted" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {generatedPrimes.map((prime, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded bg-accent/10 text-accent text-sm font-mono"
                >
                  {prime}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
