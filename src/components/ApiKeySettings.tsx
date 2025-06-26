'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Eye, EyeOff, Key, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKeySettingsProps {
  apiKey: string
  apiUrl: string
  onApiKeyChange: (key: string) => void
  onApiUrlChange: (url: string) => void
}

export function ApiKeySettings({ apiKey, apiUrl, onApiKeyChange, onApiUrlChange }: ApiKeySettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!apiKey)

  const handleApiKeyChange = (value: string) => {
    onApiKeyChange(value)
    if (value) {
      toast.success('API密钥已保存')
    }
  }

  const handleApiUrlChange = (value: string) => {
    onApiUrlChange(value)
    if (value) {
      toast.success('API地址已保存')
    }
  }

  const isApiKeyValid = apiKey && apiKey.length > 10
  const isApiUrlValid = apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">API 设置</CardTitle>
            {isApiKeyValid ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                已配置
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                未配置
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? '收起' : '展开'}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              请输入您的 AIhubMIX API 密钥和服务地址。这些信息将安全地保存在本地浏览器中。
            </AlertDescription>
          </Alert>

          {/* API 密钥输入 */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              API 密钥 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="请输入您的 AIhubMIX API 密钥"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              您可以在 AIhubMIX 控制台获取 API 密钥
            </p>
          </div>

          {/* API 地址输入 */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              API 服务地址 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="url"
              placeholder="https://api.aihubmix.com/v1"
              value={apiUrl}
              onChange={(e) => handleApiUrlChange(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              AIhubMIX API 服务的基础地址
            </p>
          </div>

          {/* 状态提示 */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isApiKeyValid ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">API密钥</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isApiUrlValid ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">服务地址</span>
            </div>
          </div>

          {(!isApiKeyValid || !isApiUrlValid) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                请确保 API 密钥和服务地址都已正确配置，否则无法使用 AI 生成功能。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  )
} 