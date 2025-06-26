'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, X, FileImage, AlertCircle, Download, Upload, Clipboard, ClipboardPaste } from 'lucide-react'
import { toast } from 'sonner'

export interface BatchItem {
  id: string
  imageUrl: string
  productInfo: string
}

interface BatchUploadProps {
  items: BatchItem[]
  onItemsChange: (items: BatchItem[]) => void
  maxItems?: number
}

export function BatchUpload({ items, onItemsChange, maxItems = 20 }: BatchUploadProps) {
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newProductInfo, setNewProductInfo] = useState('')
  const [pasteData, setPasteData] = useState('')
  const [showPasteArea, setShowPasteArea] = useState(false)
  const pasteTextareaRef = useRef<HTMLTextAreaElement>(null)

  // 生成唯一ID
  const generateId = () => {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 添加新项目
  const addItem = () => {
    if (!newImageUrl.trim()) {
      toast.error('请输入图片链接')
      return
    }

    // 验证URL格式
    const urlPattern = /^(https?:\/\/).*\.(jpg|jpeg|png|webp)(\?.*)?$/i
    if (!urlPattern.test(newImageUrl.trim())) {
      toast.error('请输入有效的图片URL（支持 JPG、PNG、WebP 格式）')
      return
    }

    // 检查数量限制
    if (items.length >= maxItems) {
      toast.error(`最多只能添加 ${maxItems} 个项目`)
      return
    }

    // 检查是否重复
    if (items.some(item => item.imageUrl === newImageUrl.trim())) {
      toast.error('该图片链接已存在')
      return
    }

    const newItem: BatchItem = {
      id: generateId(),
      imageUrl: newImageUrl.trim(),
      productInfo: newProductInfo.trim()
    }

    onItemsChange([...items, newItem])
    setNewImageUrl('')
    setNewProductInfo('')
    toast.success('项目添加成功')
  }

  // 处理粘贴数据
  const handlePasteData = () => {
    if (!pasteData.trim()) {
      toast.error('请粘贴表格数据')
      return
    }

    try {
      // 按行分割数据
      const lines = pasteData.trim().split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        toast.error('粘贴的数据为空')
        return
      }

      const newItems: BatchItem[] = []
      const errors: string[] = []
      const urlPattern = /^(https?:\/\/).*\.(jpg|jpeg|png|webp)(\?.*)?$/i

      lines.forEach((line, index) => {
        // 支持多种分隔符：制表符、逗号、分号、多个空格
        const parts = line.split(/\t|,|;|\s{2,}/).map(s => s.trim()).filter(s => s)
        
        if (parts.length === 0) {
          errors.push(`第 ${index + 1} 行：数据为空`)
          return
        }

        const imageUrl = parts[0]
        const productInfo = parts.slice(1).join(' ') || '' // 将剩余部分作为产品信息

        if (!imageUrl) {
          errors.push(`第 ${index + 1} 行：图片链接为空`)
          return
        }

        // 如果不是完整URL，尝试添加协议
        let finalImageUrl = imageUrl
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
          finalImageUrl = `https://${imageUrl}`
        }

        if (!urlPattern.test(finalImageUrl)) {
          errors.push(`第 ${index + 1} 行：图片链接格式无效 (${imageUrl})`)
          return
        }

        if (items.some(item => item.imageUrl === finalImageUrl) || 
            newItems.some(item => item.imageUrl === finalImageUrl)) {
          errors.push(`第 ${index + 1} 行：图片链接重复`)
          return
        }

        newItems.push({
          id: generateId(),
          imageUrl: finalImageUrl,
          productInfo
        })
      })

      if (items.length + newItems.length > maxItems) {
        toast.error(`粘贴失败：总项目数不能超过 ${maxItems} 个`)
        return
      }

      if (errors.length > 0) {
        toast.error(`部分数据粘贴失败:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`)
      }

      if (newItems.length > 0) {
        onItemsChange([...items, ...newItems])
        setPasteData('')
        setShowPasteArea(false)
        toast.success(`成功粘贴 ${newItems.length} 个项目`)
      }
    } catch (error) {
      toast.error('数据解析失败，请检查格式')
    }
  }

  // 自动检测剪贴板内容并粘贴
  const handleAutoDetectPaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText()
        if (clipboardText.trim()) {
          setPasteData(clipboardText)
          setShowPasteArea(true)
          // 聚焦到粘贴区域
          setTimeout(() => {
            pasteTextareaRef.current?.focus()
          }, 100)
          toast.success('已从剪贴板获取数据，请检查并确认')
        } else {
          toast.error('剪贴板为空')
        }
      } else {
        // 如果不支持剪贴板API，显示粘贴区域让用户手动粘贴
        setShowPasteArea(true)
        setTimeout(() => {
          pasteTextareaRef.current?.focus()
        }, 100)
        toast.info('请手动粘贴表格数据')
      }
    } catch (error) {
      // 权限被拒绝或其他错误，显示粘贴区域
      setShowPasteArea(true)
      setTimeout(() => {
        pasteTextareaRef.current?.focus()
      }, 100)
      toast.info('请手动粘贴表格数据')
    }
  }

  // 删除项目
  const removeItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id)
    onItemsChange(newItems)
    toast.success('项目已删除')
  }

  // 更新项目
  const updateItem = (id: string, field: 'imageUrl' | 'productInfo', value: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    )
    onItemsChange(newItems)
  }

  // 清空所有项目
  const clearAll = () => {
    onItemsChange([])
    toast.success('已清空所有项目')
  }

  // 导入CSV格式数据
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length === 0) {
          toast.error('文件内容为空')
          return
        }

        const newItems: BatchItem[] = []
        const errors: string[] = []
        const urlPattern = /^(https?:\/\/).*\.(jpg|jpeg|png|webp)(\?.*)?$/i

        lines.forEach((line, index) => {
          const [imageUrl, productInfo] = line.split(',').map(s => s.trim())
          
          if (!imageUrl) {
            errors.push(`第 ${index + 1} 行：图片链接为空`)
            return
          }

          if (!urlPattern.test(imageUrl)) {
            errors.push(`第 ${index + 1} 行：图片链接格式无效`)
            return
          }

          if (items.some(item => item.imageUrl === imageUrl) || 
              newItems.some(item => item.imageUrl === imageUrl)) {
            errors.push(`第 ${index + 1} 行：图片链接重复`)
            return
          }

          newItems.push({
            id: generateId(),
            imageUrl,
            productInfo: productInfo || ''
          })
        })

        if (items.length + newItems.length > maxItems) {
          toast.error(`导入失败：总项目数不能超过 ${maxItems} 个`)
          return
        }

        if (errors.length > 0) {
          toast.error(`部分项目导入失败:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`)
        }

        if (newItems.length > 0) {
          onItemsChange([...items, ...newItems])
          toast.success(`成功导入 ${newItems.length} 个项目`)
        }
      } catch (error) {
        toast.error('文件解析失败，请检查格式')
      }
    }
    reader.readAsText(file)
  }

  // 导出CSV格式数据
  const exportCSV = () => {
    if (items.length === 0) {
      toast.error('没有数据可导出')
      return
    }

    const csvContent = items.map(item => 
      `"${item.imageUrl}","${item.productInfo.replace(/"/g, '""')}"`
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `batch_images_${new Date().getTime()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('数据导出成功')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>批量图片处理</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              添加多个图片链接和对应的产品信息进行批量处理
            </p>
          </div>
          <Badge variant="secondary">
            {items.length} / {maxItems}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 快速粘贴区域 */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium text-blue-800">
              <Clipboard className="h-4 w-4 inline mr-2" />
              快速粘贴表格数据
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoDetectPaste}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <ClipboardPaste className="h-4 w-4 mr-2" />
              从剪贴板粘贴
            </Button>
          </div>
          
          <p className="text-sm text-blue-700">
            💡 从Excel、Google Sheets等表格复制数据，第一列为图片链接，第二列为产品信息
          </p>

          {showPasteArea && (
            <div className="space-y-3">
              <Textarea
                ref={pasteTextareaRef}
                placeholder="请粘贴表格数据到这里...&#10;支持格式：&#10;https://example.com/image1.jpg	产品信息1&#10;https://example.com/image2.jpg	产品信息2"
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                rows={6}
                className="resize-none font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handlePasteData} disabled={!pasteData.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  解析并添加数据
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowPasteArea(false)
                  setPasteData('')
                }}>
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 添加新项目区域 */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <Label className="text-base font-medium">手动添加项目</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-image-url">图片链接</Label>
              <Input
                id="new-image-url"
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-product-info">产品信息（可选）</Label>
              <Input
                id="new-product-info"
                placeholder="产品名称、规格、材质等..."
                value={newProductInfo}
                onChange={(e) => setNewProductInfo(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={addItem} disabled={items.length >= maxItems}>
              <Plus className="h-4 w-4 mr-2" />
              添加项目
            </Button>
          </div>
        </div>

        {/* 批量操作区域 */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <Label htmlFor="csv-import" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  导入CSV
                </span>
              </Button>
            </Label>
            <Input
              id="csv-import"
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </div>
          
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            导出CSV
          </Button>
          
          {items.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearAll}>
              <X className="h-4 w-4 mr-2" />
              清空全部
            </Button>
          )}
        </div>

        {/* 项目列表表格 */}
        {items.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-20">预览</TableHead>
                  <TableHead>图片链接</TableHead>
                  <TableHead>产品信息</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="w-16 h-16 border rounded overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={`预览 ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center bg-gray-100">
                          <FileImage className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.imageUrl}
                        onChange={(e) => updateItem(item.id, 'imageUrl', e.target.value)}
                        placeholder="图片链接"
                        className="min-w-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={item.productInfo}
                        onChange={(e) => updateItem(item.id, 'productInfo', e.target.value)}
                        placeholder="产品信息（可选）"
                        rows={2}
                        className="min-w-0 resize-none"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              还没有添加任何项目。您可以：
              <br />
              • 使用"快速粘贴"功能从Excel/Google Sheets等表格复制数据
              <br />
              • 手动添加单个项目
              <br />
              • 导入CSV文件
            </AlertDescription>
          </Alert>
        )}

        {items.length > 0 && (
          <div className="text-sm text-gray-500">
            <p>• 点击表格中的内容可以直接编辑</p>
            <p>• 支持从Excel、Google Sheets等表格直接复制粘贴数据</p>
            <p>• 支持导入/导出CSV格式：图片链接,产品信息</p>
            <p>• 最多支持 {maxItems} 个项目</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 