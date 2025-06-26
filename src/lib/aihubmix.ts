// AI服务API封装

export interface GenerateDescriptionRequest {
  image: File | string | null
  productInfo?: string
  model: string
  prompt: string
  apiKey: string
  apiUrl: string
}

export interface GenerateDescriptionResponse {
  description: string
  success: boolean
  error?: string
}

// 批量处理请求
export interface BatchGenerateRequest {
  images: (File | string)[]
  productInfo?: string // 兼容旧版本的统一产品信息
  productInfos?: string[] // 新版本的每个项目的产品信息
  model: string
  prompt: string
  apiKey: string
  apiUrl: string
}

// 调用真实的AIhubMIX API
export async function generateProductDescription(
  request: GenerateDescriptionRequest
): Promise<GenerateDescriptionResponse> {
  // 检查API配置
  if (!request.apiKey || !request.apiUrl) {
    throw new Error('请先配置 API 密钥和服务地址')
  }

  try {
    // 准备请求数据
    const requestBody: any = {
      model: request.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildPromptText(request.prompt, request.productInfo, !!request.image, request.model)
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }

    // 添加图片
    if (request.image) {
      if (typeof request.image === 'string') {
        // URL图片
        requestBody.messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: request.image,
            detail: 'high' // 添加detail参数以确保高质量分析
          }
        })
      } else {
        // 文件图片，转换为base64
        const base64Image = await convertImageToBase64(request.image)
        requestBody.messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: base64Image,
            detail: 'high' // 添加detail参数以确保高质量分析
          }
        })
      }
    } else {
      // 如果没有图像，修改提示词告知用户
      requestBody.messages[0].content[0].text = `请注意：没有提供图像。${buildPromptText(request.prompt, request.productInfo, false, request.model)}`
    }

    // 添加调试信息（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('API请求体:', JSON.stringify(requestBody, null, 2))
    }

    // 调用API
    const response = await fetch(`${request.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      return {
        success: false,
        description: '',
        error: data.error.message || '生成失败'
      }
    }

    const description = data.choices?.[0]?.message?.content || ''
    if (!description) {
      return {
        success: false,
        description: '',
        error: '生成内容为空'
      }
    }

    return {
      success: true,
      description: description.trim()
    }

  } catch (error) {
    // 只有在明确指定使用模拟数据时才使用模拟数据
    // 可以通过环境变量 USE_MOCK_API=true 来启用
    if (process.env.USE_MOCK_API === 'true' || 
        (request.apiKey === 'demo' && request.apiUrl === 'https://api.aihubmix.com/v1')) {
      return generateMockDescription(request)
    }
    
    return {
      success: false,
      description: '',
      error: error instanceof Error ? error.message : 'API调用失败'
    }
  }
}

// 批量生成描述
export async function batchGenerateDescriptions(
  request: BatchGenerateRequest,
  onProgress?: (completed: number, total: number) => void,
  onItemComplete?: (index: number, result: GenerateDescriptionResponse, fileName: string) => void,
  productInfos?: string[] // 新增参数：每个项目的产品信息
): Promise<GenerateDescriptionResponse[]> {
  const results: GenerateDescriptionResponse[] = []
  
  for (let i = 0; i < request.images.length; i++) {
    const image = request.images[i]
    const fileName = typeof image === 'string' 
      ? getFileNameFromUrl(image) 
      : image?.name || `image-${i + 1}.jpg`
    
    // 获取当前项目的产品信息
    const currentProductInfo = productInfos?.[i] || request.productInfos?.[i] || request.productInfo
    
    // 跳过空的图片项
    if (!image) {
      const errorResult: GenerateDescriptionResponse = {
        success: false,
        description: '',
        error: '图片数据为空'
      }
      results.push(errorResult)
      onItemComplete?.(i, errorResult, fileName)
      continue
    }
    
    try {
      const result = await generateProductDescription({
        image,
        productInfo: currentProductInfo,
        model: request.model,
        prompt: request.prompt,
        apiKey: request.apiKey,
        apiUrl: request.apiUrl
      })
      
      results.push(result)
      onItemComplete?.(i, result, fileName)
      
    } catch (error) {
      const errorResult: GenerateDescriptionResponse = {
        success: false,
        description: '',
        error: error instanceof Error ? error.message : '生成失败'
      }
      
      results.push(errorResult)
      onItemComplete?.(i, errorResult, fileName)
    }
    
    onProgress?.(i + 1, request.images.length)
    
    // 添加延迟避免API限制
    if (i < request.images.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

// 构建提示词文本
function buildPromptText(prompt: string, productInfo?: string, hasImage = true, model?: string): string {
  let fullPrompt = prompt
  
  // 如果有图像，添加图像分析指示
  if (hasImage) {
    if (model?.includes('gpt-4o')) {
      // GPT-4o特殊提示
      fullPrompt = `我会为你提供一张图片，请仔细观察并分析图片内容。${prompt}`
    } else {
      // 通用图像分析提示
      fullPrompt = `请仔细分析提供的图像内容。${prompt}`
    }
  }
  
  if (productInfo) {
    fullPrompt = `${fullPrompt}\n\n补充产品信息：${productInfo}`
  }
  
  return fullPrompt
}

// 从URL中提取文件名
function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop() || 'image.jpg'
    return filename
  } catch {
    return 'image.jpg'
  }
}

// 模拟API响应（开发和测试用）
async function generateMockDescription(
  request: GenerateDescriptionRequest
): Promise<GenerateDescriptionResponse> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // 模拟错误情况
  if (Math.random() < 0.1) {
    throw new Error('API服务暂时不可用，请稍后重试')
  }
  
  // 模拟空结果
  if (Math.random() < 0.05) {
    return {
      success: false,
      description: '',
      error: '生成内容为空，请尝试调整输入或提示词'
    }
  }

  // 根据模型生成模拟描述
  const description = generateMockDescriptionByModel(request)

  return {
    success: true,
    description
  }
}

function generateMockDescriptionByModel(request: GenerateDescriptionRequest): string {
  const productInfo = request.productInfo || ''
  const isUrl = typeof request.image === 'string'
  const prompt = request.prompt
  
  // 根据不同的AI模型生成不同风格的描述
  const modelDescriptions = {
    'gpt-4o': generateGPT4Description(productInfo, isUrl, prompt),
    'gpt-4o-mini': generateGPT4MiniDescription(productInfo, isUrl, prompt),
    'claude-3-5-sonnet': generateClaudeDescription(productInfo, isUrl, prompt),
    'claude-3-5-sonnet-20240620': generateClaudeDescription(productInfo, isUrl, prompt),
    'claude-3-haiku': generateClaudeHaikuDescription(productInfo, isUrl, prompt),
    'claude-3-haiku-20240307': generateClaudeHaikuDescription(productInfo, isUrl, prompt),
    'gemini-1.5-pro': generateGeminiProDescription(productInfo, isUrl, prompt),
    'gemini-1.5-flash': generateGeminiFlashDescription(productInfo, isUrl, prompt)
  }
  
  return modelDescriptions[request.model as keyof typeof modelDescriptions] || 
         modelDescriptions['gpt-4o-mini']
}

function generateGPT4Description(productInfo: string, isUrl: boolean, prompt?: string): string {
  if (prompt && prompt !== '请为这张图片生成一个简洁明了的描述，突出其主要特点和要素。') {
    return `使用GPT-4o进行图像分析，根据您的要求"${prompt}"：

这张图片${productInfo ? `展示的"${productInfo}"` : ''}完全符合您的描述需求。${isUrl ? 'URL提供的图像' : '上传的图片'}质量优秀，细节丰富，能够很好地满足${prompt.includes('营销') ? '营销推广' : prompt.includes('详细') ? '详细分析' : prompt.includes('社交') ? '社交媒体' : '描述'}的要求。

基于先进的视觉理解能力，图片展现了清晰的构图和专业的视觉效果。${productInfo ? `结合产品信息"${productInfo}"，` : ''}内容与您的具体要求高度匹配，具有很强的实用价值。`
  }
  
  return `基于先进的GPT-4o视觉分析，这张图片展现了${productInfo ? `"${productInfo}"的` : ''}精致细节。图像具有清晰的构图和丰富的视觉元素，每个细节都经过精心设计。${isUrl ? '通过URL链接提供的' : '上传的'}图片质量优秀，色彩饱和度适中，整体呈现出专业的视觉效果。这${productInfo ? '款产品' : '个内容'}展现了现代设计理念，具有很强的视觉冲击力和实用价值。`
}

function generateGPT4MiniDescription(productInfo: string, isUrl: boolean, prompt?: string): string {
  if (prompt && prompt !== '请为这张图片生成一个简洁明了的描述，突出其主要特点和要素。') {
    return `GPT-4o Mini分析结果，按照您的要求"${prompt}"：

图片${productInfo ? `"${productInfo}"` : ''}清晰展示了相关内容。${isUrl ? '链接图片' : '上传文件'}质量良好，符合${prompt.includes('营销') ? '营销' : prompt.includes('详细') ? '详细描述' : prompt.includes('社交') ? '社交分享' : '一般'}需求。

${productInfo ? `产品"${productInfo}"的特色` : '图片内容'}与您的要求匹配，具有良好的视觉效果和实用价值。`
  }
  
  return `这是一张${productInfo ? `关于"${productInfo}"的` : ''}清晰图片。图像展示了主要特征和关键细节，${isUrl ? '链接图片' : '上传文件'}质量良好。整体设计简洁实用，具有良好的视觉效果。${productInfo ? '产品特色鲜明，' : ''}适合多种使用场景，体现了优质的制作工艺。`
}

function generateClaudeDescription(productInfo: string, isUrl: boolean, prompt?: string): string {
  // 如果有自定义提示词，使用提示词生成描述
  if (prompt && prompt !== '请为这张图片生成一个简洁明了的描述，突出其主要特点和要素。') {
    return `基于Claude 3.5 Sonnet的图像分析，根据您的要求"${prompt}"，我为这张图片生成以下描述：

这张图片${productInfo ? `展示了"${productInfo}"` : ''}具有丰富的视觉信息。${isUrl ? '通过URL提供的图像' : '上传的图片'}清晰度良好，能够满足分析需求。

根据您的具体要求，这张图片展现了相应的特征和内容，符合${prompt.includes('营销') ? '营销推广' : prompt.includes('详细') ? '详细分析' : prompt.includes('社交') ? '社交媒体' : '一般描述'}的需求。

${productInfo ? `结合提供的产品信息"${productInfo}"，` : ''}图片内容与要求高度匹配，具有良好的应用价值。`
  }
  
  // 默认Claude描述
  return `通过Claude 3.5 Sonnet的深度图像分析，我观察到这张图片${productInfo ? `展示的"${productInfo}"` : ''}具有以下特点：

• 视觉构成：图像构图平衡，主体突出，背景协调
• 色彩分析：色调搭配和谐，具有良好的视觉层次
• 细节观察：${isUrl ? '网络图片' : '本地图片'}清晰度高，细节丰富
• 整体评价：${productInfo ? '产品展示' : '内容呈现'}专业，具有较强的视觉吸引力

这${productInfo ? '款产品' : '个内容'}体现了精心的设计思路和优质的制作标准。`
}

function generateClaudeHaikuDescription(productInfo: string, isUrl: boolean, prompt?: string): string {
  if (prompt && prompt !== '请为这张图片生成一个简洁明了的描述，突出其主要特点和要素。') {
    return `Claude 3 Haiku快速分析，根据"${prompt}"的要求：

图片${productInfo ? `"${productInfo}"` : ''}符合您的描述需求。${isUrl ? '在线图片' : '本地文件'}质量良好，能够满足${prompt.includes('营销') ? '营销' : prompt.includes('详细') ? '详细' : prompt.includes('社交') ? '社交' : '一般'}用途。${productInfo ? '产品特色与' : '内容与'}要求匹配，适合应用。`
  }
  
  return `简洁而精准的分析：这张${productInfo ? `"${productInfo}"` : ''}图片清晰展示了核心要素。${isUrl ? '在线图片' : '本地文件'}具有良好的视觉质量，主体明确，细节清晰。整体呈现简洁美观，${productInfo ? '产品特色' : '内容特点'}突出，适合多种应用场景。`
}

function generateGeminiProDescription(productInfo: string, isUrl: boolean, prompt?: string): string {
  if (prompt && prompt !== '请为这张图片生成一个简洁明了的描述，突出其主要特点和要素。') {
    return `Gemini 1.5 Pro多模态分析，按照您的要求"${prompt}"：

🎯 需求匹配：图片${productInfo ? `"${productInfo}"` : ''}完全符合您的描述要求
📊 质量评估：${isUrl ? 'URL图像' : '上传文件'}质量优秀，细节清晰
🎨 内容分析：视觉元素丰富，符合${prompt.includes('营销') ? '营销推广' : prompt.includes('详细') ? '详细描述' : prompt.includes('社交') ? '社交媒体' : '一般应用'}需求
✨ 综合评价：${productInfo ? '产品展示' : '图片内容'}与要求高度匹配，具有很强的实用价值

这是一个高质量的视觉内容，能够很好地满足您的具体需求。`
  }
  
  return `基于Gemini 1.5 Pro的多模态分析，这张图片${productInfo ? `中的"${productInfo}"` : ''}展现了丰富的信息层次：

🔍 技术分析：图像分辨率适中，压缩比例合理，${isUrl ? 'URL来源' : '文件上传'}处理正常
🎨 设计评估：视觉设计符合现代审美标准，色彩搭配专业
📊 质量评价：整体质量优秀，细节保留完整
🎯 应用价值：${productInfo ? '产品展示效果' : '内容呈现'}良好，具有实际应用价值

综合评价：这是一个高质量的视觉内容，展现了${productInfo ? '产品的' : ''}核心价值和特色。`
}

function generateGeminiFlashDescription(productInfo: string, isUrl: boolean, prompt?: string): string {
  if (prompt && prompt !== '请为这张图片生成一个简洁明了的描述，突出其主要特点和要素。') {
    return `⚡ Gemini 1.5 Flash快速分析，按照"${prompt}"要求：
图片${productInfo ? `"${productInfo}"` : ''}符合描述需求，${isUrl ? '网络图像' : '本地文件'}质量稳定。内容满足${prompt.includes('营销') ? '营销' : prompt.includes('详细') ? '详细' : prompt.includes('社交') ? '社交' : '一般'}用途，${productInfo ? '产品' : '内容'}展示效果良好。`
  }
  
  return `⚡ 快速分析结果：
图片${productInfo ? `"${productInfo}"` : ''}特征明显，${isUrl ? '网络来源' : '本地上传'}质量稳定。主要元素清晰可见，整体效果良好。${productInfo ? '产品' : '内容'}展示专业，具有良好的视觉吸引力和实用价值。适合快速识别和应用。`
}

// 将图片转换为base64格式（用于API传输）
export async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 验证图片URL是否有效
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok && (response.headers.get('content-type')?.startsWith('image/') ?? false)
  } catch {
    return false
  }
}

// 验证API配置
export function validateApiConfig(apiKey: string, apiUrl: string): { valid: boolean; error?: string } {
  if (!apiKey || apiKey.length < 10) {
    return { valid: false, error: 'API密钥无效，请检查长度和格式' }
  }
  
  if (!apiUrl || !(apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    return { valid: false, error: 'API地址格式无效，请输入完整的URL地址' }
  }
  
  return { valid: true }
} 