#!/usr/bin/env python3
"""
GDevelop → CNB 云端 AI 代理

将 GDevelop 的 AI 请求格式转换为 OpenAI 兼容格式，然后调用 CNB 云端 API。
这个代理实现了 GDevelop 需要的所有端点。

使用方法：
1. 设置环境变量：
   export CNB_TOKEN="your-cnb-token"
   export CNB_API_ENDPOINT="https://api.cnb.cool"
   export CNB_REPO_SLUG="glm4-00101/aimodel"

2. 启动代理：
   python gdevelop-cnb-bridge.py

3. 在 GDevelop 中配置：
   window.enableCustomAI('http://localhost:8081/v1', 'dummy-key')
"""

import os
import sys
import time
import json
import uuid
from flask import Flask, request, Response, jsonify
from typing import Dict, List, Optional
import requests

# 配置 Flask JSON 编码器
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

# ============================================================================
# CNB 云端配置
# ============================================================================

CNB_API_ENDPOINT = os.environ.get('CNB_API_ENDPOINT', 'https://api.cnb.cool')
CNB_TOKEN = os.environ.get('CNB_TOKEN', '7B81KFTP0588WAICA6wmjvSeV8H')
CNB_REPO_SLUG = os.environ.get('CNB_REPO_SLUG', 'glm4-00101/aimodel')

# CNB 云端接口
CNB_CHAT_URL = f"{CNB_API_ENDPOINT}/{CNB_REPO_SLUG}/-/ai/chat/completions"

# 代理配置
PROXY_PORT = 8081
PROXY_HOST = '0.0.0.0'

print("=" * 70)
print("GDevelop → CNB 云端 AI 代理")
print("=" * 70)
print(f"✓ 云端端点: {CNB_API_ENDPOINT}")
print(f"✓ 仓库路径: {CNB_REPO_SLUG}")
print(f"✓ 代理地址: http://{PROXY_HOST}:{PROXY_PORT}")
print("=" * 70)

# ============================================================================
# 内存存储（用于模拟 API 请求的持久化）
# ============================================================================

# 存储 AI 请求和生成的事件
ai_requests: Dict[str, Dict] = {}
ai_generated_events: Dict[str, Dict] = {}

# ============================================================================
# 辅助函数
# ============================================================================

def generate_id() -> str:
    """生成唯一 ID"""
    return str(uuid.uuid4())


def create_gdevelop_response(user_request: str, ai_response: str, mode: str = 'chat') -> Dict:
    """
    创建 GDevelop 格式的 AI 响应

    Args:
        user_request: 用户请求
        ai_response: AI 响应
        mode: 'chat' 或 'agent'

    Returns:
        Dict: GDevelop 格式的响应
    """
    return {
        "id": generate_id(),
        "createdAt": time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
        "updatedAt": time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
        "userId": "custom-user",
        "status": "ready",
        "mode": mode,
        "error": None,
        "output": [
            {
                "type": "message",
                "status": "completed",
                "role": "assistant",
                "content": [
                    {
                        "type": "output_text",
                        "status": "completed",
                        "text": ai_response,
                        "annotations": []
                    }
                ]
            }
        ]
    }


async def call_cnb_api(messages: List[Dict]) -> str:
    """
    调用 CNB 云端 API

    Args:
        messages: 消息列表

    Returns:
        str: AI 响应文本
    """
    try:
        # 构造 CNB 请求
        cnb_request = {
            "model": "default",
            "messages": messages,
            "temperature": 0.7
        }

        headers = {
            'Authorization': f'Bearer {CNB_TOKEN}',
            'Content-Type': 'application/json'
        }

        response = requests.post(
            CNB_CHAT_URL,
            json=cnb_request,
            headers=headers,
            timeout=60
        )

        if response.status_code == 200:
            data = response.json()
            # 提取 AI 响应
            if 'choices' in data and len(data['choices']) > 0:
                return data['choices'][0]['message']['content']
            else:
                return "无法解析 AI 响应"
        else:
            return f"API 错误: {response.status_code} - {response.text}"

    except Exception as e:
        return f"调用 CNB API 失败: {str(e)}"


def generate_ai_response_async(ai_request_id: str, user_request: str, mode: str):
    """
    异步生成 AI 响应

    Args:
        ai_request_id: AI 请求 ID
        user_request: 用户请求
        mode: 'chat' 或 'agent'
    """
    # 标记为工作状态
    ai_requests[ai_request_id]['status'] = 'working'

    # 准备消息
    messages = [
        {
            "role": "system",
            "content": "You are a helpful game development assistant using GDevelop."
        },
        {
            "role": "user",
            "content": user_request
        }
    ]

    # 调用 CNB API
    ai_response = call_cnb_api(messages)

    # 更新请求状态
    ai_requests[ai_request_id]['status'] = 'ready'
    ai_requests[ai_request_id]['output'] = create_gdevelop_response(user_request, ai_response, mode)['output']
    ai_requests[ai_request_id]['updatedAt'] = time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')

# ============================================================================
# Flask 路由
# ============================================================================

@app.route('/', methods=['GET'])
def index():
    """首页"""
    return jsonify({
        "service": "GDevelop → CNB Cloud Proxy",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "ai_request": "/v1/ai-request",
            "ai_generated_event": "/v1/ai-generated-event",
            "health": "/health"
        },
        "backend": {
            "type": "CNB Cloud API",
            "endpoint": CNB_API_ENDPOINT,
            "repo": CNB_REPO_SLUG
        }
    })


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        "status": "ok",
        "service": "GDevelop → CNB Cloud Proxy",
        "port": PROXY_PORT
    })


@app.route('/v1/ai-request', methods=['POST'])
def create_ai_request():
    """
    创建 AI 请求（GDevelop 格式）

    接收 GDevelop 的请求格式，转换为 OpenAI 格式，调用 CNB API
    """
    try:
        data = request.get_json()

        # 提取必要参数
        user_request = data.get('userRequest', '')
        mode = data.get('mode', 'chat')
        userId = data.get('userId', 'custom-user')

        # 生成请求 ID
        ai_request_id = generate_id()

        # 创建初始请求记录
        ai_requests[ai_request_id] = {
            "id": ai_request_id,
            "createdAt": time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            "updatedAt": time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            "userId": userId,
            "status": "working",  # 初始状态为 working
            "mode": mode,
            "error": None,
            "output": []
        }

        # 异步生成响应（在 Flask 中使用线程）
        import threading
        thread = threading.Thread(
            target=generate_ai_response_async,
            args=(ai_request_id, user_request, mode)
        )
        thread.daemon = True
        thread.start()

        # 返回初始响应
        return jsonify(ai_requests[ai_request_id])

    except Exception as e:
        return jsonify({
            "error": {
                "code": "internal_error",
                "message": str(e)
            }
        }), 500


@app.route('/v1/ai-request/<ai_request_id>', methods=['GET'])
def get_ai_request(ai_request_id):
    """
    获取 AI 请求状态

    Args:
        ai_request_id: AI 请求 ID
    """
    try:
        userId = request.args.get('userId', 'custom-user')

        if ai_request_id not in ai_requests:
            return jsonify({
                "error": {
                    "code": "not_found",
                    "message": "AI request not found"
                }
            }), 404

        return jsonify(ai_requests[ai_request_id])

    except Exception as e:
        return jsonify({
            "error": {
                "code": "internal_error",
                "message": str(e)
            }
        }), 500


@app.route('/v1/ai-generated-event', methods=['POST'])
def create_ai_generated_event():
    """
    创建 AI 生成事件（用于生成 GDevelop 事件代码）

    这个端点用于生成事件代码，而不是对话
    """
    try:
        data = request.get_json()

        # 提取参数
        eventsDescription = data.get('eventsDescription', '')
        sceneName = data.get('sceneName', '')
        userId = data.get('userId', 'custom-user')

        # 生成事件代码
        messages = [
            {
                "role": "system",
                "content": "You are a GDevelop expert. Generate event code in JSON format based on the user's description."
            },
            {
                "role": "user",
                "content": f"Scene: {sceneName}\n\nDescription: {eventsDescription}"
            }
        ]

        generated_events = call_cnb_api(messages)

        # 创建事件记录
        event_id = generate_id()
        ai_generated_events[event_id] = {
            "id": event_id,
            "createdAt": time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            "updatedAt": time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            "userId": userId,
            "status": "ready",
            "eventsDescription": eventsDescription,
            "resultMessage": generated_events,
            "changes": None,
            "error": None
        }

        return jsonify(ai_generated_events[event_id])

    except Exception as e:
        return jsonify({
            "error": {
                "code": "internal_error",
                "message": str(e)
            }
        }), 500


@app.route('/v1/ai-generated-event/<event_id>', methods=['GET'])
def get_ai_generated_event(event_id):
    """
    获取 AI 生成事件

    Args:
        event_id: 事件 ID
    """
    try:
        userId = request.args.get('userId', 'custom-user')

        if event_id not in ai_generated_events:
            return jsonify({
                "error": {
                    "code": "not_found",
                    "message": "AI generated event not found"
                }
            }), 404

        return jsonify(ai_generated_events[event_id])

    except Exception as e:
        return jsonify({
            "error": {
                "code": "internal_error",
                "message": str(e)
            }
        }), 500


# ============================================================================
# 启动服务
# ============================================================================

if __name__ == '__main__':
    print(f"\n🚀 服务已启动，访问 http://localhost:{PROXY_PORT}\n")
    print("📝 在 GDevelop 中配置:")
    print(f"   window.enableCustomAI('http://localhost:{PROXY_PORT}/v1', 'dummy-key')")
    print()

    app.run(host=PROXY_HOST, port=PROXY_PORT, debug=True, threaded=True)
