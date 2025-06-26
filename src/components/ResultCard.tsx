'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, RefreshCw, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ResultCardProps {
  result: string | null
  isLoading: boolean
  onRegenerate: () => void
}

export function ResultCard({ result, isLoading, onRegenerate }: ResultCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!result) return
    
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      toast.success('内容已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败，请手动选择复制')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium">生成结果</CardTitle>
        {result && !isLoading && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? '已复制' : '复制'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
            >
              <RefreshCw className="h-4 w-4" />
              重新生成
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[85%]" />
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {result}
              </p>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertDescription className="text-gray-600">
              请先完善产品信息并点击生成按钮，系统将为您生成专业的产品描述。
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 