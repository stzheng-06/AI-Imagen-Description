'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Copy, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  RefreshCw,
  FileImage,
  Clipboard
} from 'lucide-react'
import { toast } from 'sonner'

export interface BatchResultItem {
  id: string
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: string
  error?: string
  progress?: number
}

interface BatchResultsProps {
  results: BatchResultItem[]
  isProcessing: boolean
  onRetry: (id: string) => void
  onRetryAll: () => void
  getImageUrl?: (id: string) => string
}

export function BatchResults({ results, isProcessing, onRetry, onRetryAll, getImageUrl }: BatchResultsProps) {
  const tableRef = useRef<HTMLTableElement>(null)

  const getOverallProgress = () => {
    if (results.length === 0) return 0
    const completed = results.filter(item => 
      item.status === 'completed' || item.status === 'failed'
    ).length
    return (completed / results.length) * 100
  }

  const getStatusCounts = () => {
    return {
      pending: results.filter(item => item.status === 'pending').length,
      processing: results.filter(item => item.status === 'processing').length,
      completed: results.filter(item => item.status === 'completed').length,
      failed: results.filter(item => item.status === 'failed').length,
    }
  }

  const copyResult = async (result: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(result)
      toast.success(`${fileName} 的描述已复制到剪贴板`)
    } catch (error) {
      toast.error('复制失败，请手动选择复制')
    }
  }

  const copyTableData = async () => {
    const completedResults = results.filter(item => item.status === 'completed' && item.result)
    
    if (completedResults.length === 0) {
      toast.error('没有完成的结果可复制')
      return
    }
    
    // 只复制数据行，不包含表头
    const dataRows = completedResults.map(item => {
      const imageUrl = getImageUrl ? getImageUrl(item.id) : ''
      
      // 去掉文件名的扩展名
      const fileName = item.fileName.replace(/\.[^/.]+$/, '')
      
      // 将描述中的换行符和多余空格处理成单行，便于Excel显示
      const description = item.result
        ?.replace(/\n+/g, ' ')  // 将换行符替换为空格
        ?.replace(/\s+/g, ' ')  // 将多个空格替换为单个空格
        ?.replace(/\t/g, ' ')   // 将制表符替换为空格
        ?.trim() || ''          // 去掉首尾空格
      
      return [fileName, imageUrl, description].join('\t')
    })
    
    const tableData = dataRows.join('\n')
    
    try {
      await navigator.clipboard.writeText(tableData)
      toast.success(`已复制 ${completedResults.length} 条结果到剪贴板，可直接粘贴到Excel`)
    } catch (error) {
      console.error('复制失败:', error)
      toast.error('复制失败，请手动选择复制')
    }
  }

  const exportCSV = () => {
    const completedResults = results.filter(item => item.status === 'completed' && item.result)
    
    if (completedResults.length === 0) {
      toast.error('没有完成的结果可导出')
      return
    }

    const headers = ['图片名称', '图片链接', '产品描述']
    const csvContent = [
      headers.join(','),
      ...completedResults.map(item => {
        const imageUrl = getImageUrl ? getImageUrl(item.id) : ''
        const fileName = `"${item.fileName}"`
        const imageUrlCsv = `"${imageUrl}"`
        const description = `"${item.result?.replace(/"/g, '""') || ''}"`
        
        return [fileName, imageUrlCsv, description].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `图片描述结果_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('结果已导出为CSV文件')
  }

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'processing':
        return <div className="animate-spin rounded-full w-4 h-4 border-2 border-blue-600 border-t-transparent" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const renderStatusText = (item: BatchResultItem) => {
    switch (item.status) {
      case 'pending':
        return '等待处理'
      case 'processing':
        return '正在生成...'
      case 'completed':
        return '已完成'
      case 'failed':
        return item.error || '生成失败'
      default:
        return '未知状态'
    }
  }

  const statusCounts = getStatusCounts()
  const hasResults = results.length > 0
  const hasCompletedResults = statusCounts.completed > 0
  const hasFailedResults = statusCounts.failed > 0

  if (!hasResults) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              批量处理结果将在这里显示。请先添加图片项目并开始生成。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">批量处理结果</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {hasCompletedResults && (
              <>
                <Button variant="outline" size="sm" onClick={copyTableData}>
                  <Clipboard className="h-4 w-4 mr-1" />
                  复制表格
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-1" />
                  导出CSV
                </Button>
              </>
            )}
            {hasFailedResults && (
              <Button variant="outline" size="sm" onClick={onRetryAll}>
                <RefreshCw className="h-4 w-4 mr-1" />
                重试失败项
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          表格格式结果，可直接复制粘贴到Excel、Google Sheets等表格软件
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 总体进度 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">总体进度</span>
            <span className="text-sm text-gray-500">
              {statusCounts.completed + statusCounts.failed} / {results.length}
            </span>
          </div>
          <Progress value={getOverallProgress()} className="h-2" />
        </div>

        {/* 状态统计 */}
        <div className="flex gap-2 flex-wrap">
          {statusCounts.pending > 0 && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              等待中 {statusCounts.pending}
            </Badge>
          )}
          {statusCounts.processing > 0 && (
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              <div className="animate-spin rounded-full w-3 h-3 border border-blue-600 border-t-transparent mr-1" />
              处理中 {statusCounts.processing}
            </Badge>
          )}
          {statusCounts.completed > 0 && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              已完成 {statusCounts.completed}
            </Badge>
          )}
          {statusCounts.failed > 0 && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              失败 {statusCounts.failed}
            </Badge>
          )}
        </div>

        {/* 结果表格 */}
        <div className="border rounded-lg overflow-hidden">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">状态</TableHead>
                <TableHead className="w-32">图片名称</TableHead>
                <TableHead className="w-20">图片预览</TableHead>
                <TableHead>产品描述</TableHead>
                <TableHead className="w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((item) => (
                <TableRow key={item.id} className="align-top">
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {renderStatusIcon(item.status)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm break-all" title={item.fileName}>
                        {item.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {renderStatusText(item)}
                      </p>
                      {item.status === 'processing' && item.progress !== undefined && (
                        <Progress value={item.progress} className="h-1" />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="w-16 h-16 border rounded overflow-hidden bg-gray-100">
                      {(() => {
                        const imageUrl = getImageUrl ? getImageUrl(item.id) : ''
                        if (imageUrl) {
                          return (
                            <img
                              src={imageUrl}
                              alt={item.fileName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                target.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          )
                        }
                        return null
                      })()}
                      <div className={`w-full h-full flex items-center justify-center ${getImageUrl && getImageUrl(item.id) ? 'hidden' : ''}`}>
                        <FileImage className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-md">
                      {item.status === 'completed' && item.result ? (
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                          <p className="whitespace-pre-wrap leading-relaxed text-green-800">
                            {item.result}
                          </p>
                        </div>
                      ) : item.status === 'failed' ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                          <p className="text-red-700">
                            {item.error || '生成失败'}
                          </p>
                        </div>
                      ) : item.status === 'processing' ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                          <div className="text-blue-700 flex items-center">
                            <div className="animate-spin rounded-full w-4 h-4 border-2 border-blue-600 border-t-transparent mr-2" />
                            正在生成描述...
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                          <p className="text-gray-600">等待处理</p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {item.status === 'completed' && item.result && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyResult(item.result!, item.fileName)}
                          className="w-full"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          复制
                        </Button>
                      )}
                      
                      {(item.status === 'failed' || item.status === 'completed') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRetry(item.id)}
                          className="w-full"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          重新生成
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 使用说明 */}
        {hasCompletedResults && (
          <Alert>
            <Clipboard className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>💡 <strong>复制表格</strong>：点击"复制表格"按钮，可直接粘贴到Excel、Google Sheets等表格软件</p>
                <p>📊 <strong>导出CSV</strong>：点击"导出CSV"按钮，下载完整的结果文件</p>
                <p>🔄 <strong>重新生成</strong>：每个项目都可以单独重新生成，完善结果</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 