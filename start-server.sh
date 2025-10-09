#!/bin/bash

# Abric Image Server 시작 스크립트

echo "🚀 Starting Abric Image Server..."

# 서버 디렉토리로 이동
cd "$(dirname "$0")/server"

# Node.js가 설치되어 있는지 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "Node.js를 설치해주세요: https://nodejs.org/"
    exit 1
fi

# npm이 설치되어 있는지 확인
if ! command -v npm &> /dev/null; then
    echo "❌ npm이 설치되어 있지 않습니다."
    exit 1
fi

# package.json이 있는지 확인
if [ ! -f "package.json" ]; then
    echo "❌ package.json을 찾을 수 없습니다."
    exit 1
fi

# 의존성 설치
echo "📦 Installing dependencies..."
npm install

# .env 파일이 있는지 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사하여 생성하세요."
    echo "cp .env.example .env"
    echo "그리고 실제 값으로 수정하세요."
    exit 1
fi

# 서버 시작
echo "🌟 Starting server on http://localhost:3001"
echo "Press Ctrl+C to stop the server"
echo ""

npm start
