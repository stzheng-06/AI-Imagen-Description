'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PromptSelectProps {
  model: string
  prompt: string
  onModelChange: (model: string) => void
  onPromptChange: (prompt: string) => void
}

// AIHUBmix 支持的AI模型（使用正确的模型ID）
const MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o - 最新视觉理解模型' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini - 快速高效版本' },
  { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet - 强大的图像分析' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku - 快速响应' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro - Google最新模型' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash - 快速处理' }
]

const PROMPT_TEMPLATES = [
  {
    value: 'brief',
    label: '简要介绍',
    content: '请为这张图片生成一个简洁明了的描述，突出其主要特点和要素。'
  },
  {
    value: 'detailed',
    label: '详细分析',
    content: '请详细描述这张图片的内容，包括主要对象、颜色、构图、背景等所有可见元素，以及可能的用途或意义。'
  },
  {
    value: 'marketing',
    label: '营销文案',
    content: '请为这张图片生成吸引人的营销描述，突出产品或内容的卖点和优势，适合用于商业推广。'
  },
  {
    value: 'social',
    label: '社交媒体',
    content: '请生成适合社交媒体分享的图片描述，语言生动有趣，能够吸引用户关注和互动。'
  },
  {
    value: 'professional',
    label: '专业分析',
    content: '请以专业的角度分析这张图片，包括技术特征、设计元素、质量评估等专业维度。'
  },
  {
    value: 'seo',
    label: 'SEO优化',
    content: '请为这张图片生成SEO友好的描述，包含关键词，适合用作alt文本或图片说明。'
  }
]

export function PromptSelect({ model, prompt, onModelChange, onPromptChange }: PromptSelectProps) {
  const [isCustomPrompt, setIsCustomPrompt] = useState(true)

  const handleTemplateSelect = (templateValue: string) => {
    const template = PROMPT_TEMPLATES.find(t => t.value === templateValue)
    if (template) {
      onPromptChange(template.content)
      setIsCustomPrompt(false)
    }
  }

  const handleCustomPrompt = () => {
    setIsCustomPrompt(true)
    onPromptChange('')
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* 模型选择 */}
        <div className="space-y-2">
          <Label className="text-base font-medium">选择 AI 模型</Label>
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="请选择 AIHUBmix 支持的模型" />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            不同模型在图像理解能力和响应速度上各有特色，请根据需求选择
          </p>
        </div>

        {/* 提示词设置 */}
        <div className="space-y-4">
          <Label className="text-base font-medium">提示词设置</Label>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={isCustomPrompt ? "default" : "outline"}
              size="sm"
              onClick={handleCustomPrompt}
            >
              自定义
            </Button>
            {PROMPT_TEMPLATES.map((template) => (
              <Button
                key={template.value}
                variant={!isCustomPrompt && prompt === template.content ? "default" : "outline"}
                size="sm"
                onClick={() => handleTemplateSelect(template.value)}
              >
                {template.label}
              </Button>
            ))}
          </div>

          <Textarea
            placeholder="请输入自定义提示词，或点击上方模板快速选择..."
            value={prompt}
            onChange={(e) => {
              onPromptChange(e.target.value)
              setIsCustomPrompt(true)
            }}
            rows={4}
            className="resize-none"
          />
          
          <p className="text-sm text-gray-500">
            提示词将影响生成结果的风格和内容重点，建议根据使用场景选择合适的模板或自定义。
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 