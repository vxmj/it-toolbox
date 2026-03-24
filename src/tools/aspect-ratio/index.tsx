import { useState, useMemo, useCallback } from 'react'
import { Copy, Check, ArrowLeftRight } from 'lucide-react'
import { ToolLayout } from '@/components/tool/ToolLayout'
import { useClipboard } from '@/hooks/useClipboard'
import { meta } from './meta'

const COMMON_RESOLUTIONS: { name: string; width: number; height: number; category: string }[] = [
  { name: 'HD', width: 1280, height: 720, category: '16:9' },
  { name: 'Full HD', width: 1920, height: 1080, category: '16:9' },
  { name: '2K', width: 2560, height: 1440, category: '16:9' },
  { name: '4K UHD', width: 3840, height: 2160, category: '16:9' },
  { name: '8K UHD', width: 7680, height: 4320, category: '16:9' },
  { name: 'SVGA', width: 800, height: 600, category: '4:3' },
  { name: 'XGA', width: 1024, height: 768, category: '4:3' },
  { name: 'SXGA', width: 1280, height: 1024, category: '5:4' },
  { name: 'UXGA', width: 1600, height: 1200, category: '4:3' },
  { name: 'iPhone 14', width: 1170, height: 2532, category: '9:19.5' },
  { name: 'iPhone 14 Pro', width: 1179, height: 2556, category: '9:19.5' },
  { name: 'iPhone SE', width: 750, height: 1334, category: '9:16' },
  { name: 'iPad Pro 11"', width: 1668, height: 2388, category: '3:4' },
  { name: 'iPad Pro 12.9"', width: 2048, height: 2732, category: '3:4' },
  { name: 'Android HD', width: 720, height: 1280, category: '9:16' },
  { name: 'Android FHD', width: 1080, height: 1920, category: '9:16' },
  { name: 'Android QHD', width: 1440, height: 2560, category: '9:16' },
  { name: 'Square', width: 1080, height: 1080, category: '1:1' },
  { name: 'Instagram Post', width: 1080, height: 1350, category: '4:5' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: '9:16' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: '16:9' },
  { name: 'Twitter Header', width: 1500, height: 500, category: '3:1' },
  { name: 'Facebook Cover', width: 820, height: 312, category: '2.6:1' },
  { name: 'LinkedIn Banner', width: 1584, height: 396, category: '4:1' },
  { name: 'A4 300dpi', width: 2480, height: 3508, category: '1:1.41' },
  { name: 'A3 300dpi', width: 3508, height: 4961, category: '1:1.41' },
  { name: 'Letter 300dpi', width: 2550, height: 3300, category: '1:1.29' },
]

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

function simplifyRatio(width: number, height: number): { w: number; h: number } {
  const divisor = gcd(width, height)
  return {
    w: Math.round(width / divisor),
    h: Math.round(height / divisor),
  }
}

function formatRatio(w: number, h: number): string {
  return `${w}:${h}`
}

export default function AspectRatioCalculator() {
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)
  const [mode, setMode] = useState<'dimension' | 'ratio'>('dimension')
  const [ratioW, setRatioW] = useState(16)
  const [ratioH, setRatioH] = useState(9)
  const { copy, copied } = useClipboard()

  const aspectRatio = useMemo(() => {
    return simplifyRatio(width, height)
  }, [width, height])

  const ratioValue = useMemo(() => {
    return width / height
  }, [width, height])

  const resolutionsForRatio = useMemo(() => {
    const targetRatio = ratioW / ratioH
    const results: { width: number; height: number }[] = []
    
    const heights = [480, 720, 1080, 1440, 2160, 4320]
    for (const h of heights) {
      const w = Math.round(h * targetRatio)
      results.push({ width: w, height: h })
    }
    
    return results
  }, [ratioW, ratioH])

  const matchingResolutions = useMemo(() => {
    const targetRatio = width / height
    return COMMON_RESOLUTIONS.filter(res => {
      const resRatio = res.width / res.height
      return Math.abs(resRatio - targetRatio) < 0.01
    })
  }, [width, height])

  const swapDimensions = useCallback(() => {
    setWidth(height)
    setHeight(width)
  }, [width, height])

  const applyResolution = useCallback((w: number, h: number) => {
    setWidth(w)
    setHeight(h)
  }, [])

  const reset = () => {
    setWidth(1920)
    setHeight(1080)
    setMode('dimension')
    setRatioW(16)
    setRatioH(9)
  }

  return (
    <ToolLayout meta={meta} onReset={reset}>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setMode('dimension')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'dimension'
              ? 'bg-accent text-bg-base'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
          }`}
        >
          按尺寸计算
        </button>
        <button
          onClick={() => setMode('ratio')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'ratio'
              ? 'bg-accent text-bg-base'
              : 'bg-bg-surface text-text-secondary hover:bg-bg-raised border border-border-base'
          }`}
        >
          按比例计算
        </button>
      </div>

      {mode === 'dimension' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-sm font-medium text-text-primary mb-3">输入尺寸</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-text-muted block mb-1">宽度</label>
                  <input
                    type="number"
                    value={width}
                    onChange={e => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-text-primary font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                <button
                  onClick={swapDimensions}
                  className="p-2 rounded-lg bg-bg-raised border border-border-base hover:border-accent transition-colors mt-4"
                  title="交换宽高"
                >
                  <ArrowLeftRight className="w-4 h-4 text-text-secondary" />
                </button>
                <div className="flex-1">
                  <label className="text-xs text-text-muted block mb-1">高度</label>
                  <input
                    type="number"
                    value={height}
                    onChange={e => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-text-primary font-mono focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">宽高比</span>
                <button
                  onClick={() => copy(formatRatio(aspectRatio.w, aspectRatio.h))}
                  className="p-1 rounded hover:bg-accent/20"
                >
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-accent/60" />}
                </button>
              </div>
              <div className="text-2xl font-mono font-bold text-accent">
                {formatRatio(aspectRatio.w, aspectRatio.h)}
              </div>
              <div className="text-sm text-text-secondary mt-1">
                比值: {ratioValue.toFixed(4)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-sm font-medium text-text-primary mb-3">可视化预览</h3>
              <div className="flex items-center justify-center p-4 bg-bg-raised rounded-lg">
                <div
                  className="bg-accent/20 border-2 border-accent rounded"
                  style={{
                    width: Math.min(200, 200 * (width / Math.max(width, height))),
                    height: Math.min(200, 200 * (height / Math.max(width, height))),
                  }}
                />
              </div>
              <div className="text-center text-xs text-text-muted mt-2">
                {width} × {height} 像素
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-sm font-medium text-text-primary mb-3">匹配的常见分辨率</h3>
              {matchingResolutions.length > 0 ? (
                <div className="space-y-2">
                  {matchingResolutions.map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-bg-raised hover:bg-bg-base cursor-pointer"
                      onClick={() => applyResolution(res.width, res.height)}
                    >
                      <span className="text-sm text-text-primary">{res.name}</span>
                      <span className="text-xs font-mono text-text-muted">{res.width}×{res.height}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center py-4">没有匹配的常见分辨率</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
              <h3 className="text-sm font-medium text-text-primary mb-3">常见分辨率参考</h3>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {COMMON_RESOLUTIONS.slice(0, 16).map((res, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-bg-raised hover:bg-bg-base cursor-pointer"
                    onClick={() => applyResolution(res.width, res.height)}
                  >
                    <div className="text-xs font-medium text-text-primary">{res.name}</div>
                    <div className="text-xs font-mono text-text-muted">{res.width}×{res.height}</div>
                    <div className="text-xs text-accent">{res.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
            <h3 className="text-sm font-medium text-text-primary mb-3">输入比例</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-text-muted block mb-1">宽</label>
                <input
                  type="number"
                  value={ratioW}
                  onChange={e => setRatioW(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-text-primary font-mono focus:outline-none focus:border-accent"
                />
              </div>
              <span className="text-xl text-text-muted mt-4">:</span>
              <div className="flex-1">
                <label className="text-xs text-text-muted block mb-1">高</label>
                <input
                  type="number"
                  value={ratioH}
                  onChange={e => setRatioH(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg bg-bg-raised border border-border-base text-text-primary font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg-surface border border-border-base">
            <h3 className="text-sm font-medium text-text-primary mb-3">常见分辨率</h3>
            <div className="space-y-2">
              {resolutionsForRatio.map((res, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-bg-raised hover:bg-bg-base cursor-pointer"
                  onClick={() => {
                    setWidth(res.width)
                    setHeight(res.height)
                    setMode('dimension')
                  }}
                >
                  <span className="text-sm text-text-primary">{res.width}×{res.height}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      copy(`${res.width}x${res.height}`)
                    }}
                    className="p-1 rounded hover:bg-accent/20"
                  >
                    {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3 text-text-muted" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
