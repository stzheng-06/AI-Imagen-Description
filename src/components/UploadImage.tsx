'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Link, X } from 'lucide-react'
import { toast } from 'sonner'

interface UploadImageProps {
  onImageChange: (image: File | string | null) => void
  onProductInfoChange: (info: string) => void
  image: File | string | null
  productInfo: string
}

export function UploadImage({ onImageChange, onProductInfoChange, image, productInfo }: UploadImageProps) {
  const [imageUrl, setImageUrl] = useState('')
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('请上传支持的图片格式（JPG、PNG、WebP）')
      return
    }

    // 验证文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }

    onImageChange(file)
    setImageUrl('') // 清空URL输入
  }

  const handleUrlChange = (url: string) => {
    setImageUrl(url)
    
    // 简单的URL验证
    const urlPattern = /^(https?:\/\/).*\.(jpg|jpeg|png|webp)(\?.*)?$/i
    if (url && urlPattern.test(url)) {
      onImageChange(url)
    } else if (url) {
      toast.error('请输入有效的图片URL')
    }
  }

  const clearImage = () => {
    onImageChange(null)
    setImageUrl('')
  }

  const getImagePreview = () => {
    if (!image) return null
    
    if (typeof image === 'string') {
      return image
    } else {
      return URL.createObjectURL(image)
    }
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* 图片上传区域 */}
        <div className="space-y-4">
          <Label className="text-base font-medium">产品图片</Label>
          
          {image && (
            <div className="relative">
              <img
                src={getImagePreview()!}
                alt="预览图片"
                className="w-full max-w-md h-48 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={clearImage}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">本地上传</TabsTrigger>
              <TabsTrigger value="url">图片链接</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500">
                      点击上传
                    </span>
                    <span className="text-gray-600"> 或拖拽图片到此处</span>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  支持 JPG、PNG、WebP 格式，最大 5MB
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={() => handleUrlChange(imageUrl)}>
                  <Link className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-gray-500 text-sm">
                请输入有效的图片URL地址
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* 产品信息输入区域 */}
        <div className="space-y-2">
          <Label htmlFor="product-info" className="text-base font-medium">
            产品信息（可选）
          </Label>
          <Textarea
            id="product-info"
            placeholder="请输入产品的详细信息，如名称、规格、材质、颜色等..."
            value={productInfo}
            onChange={(e) => onProductInfoChange(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <p className="text-sm text-gray-500">
            提供产品信息有助于生成更准确的描述
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 