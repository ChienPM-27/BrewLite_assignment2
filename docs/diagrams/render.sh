#!/usr/bin/env bash
# ==============================================================================
# Script tự động kết xuất sơ đồ PlantUML (.puml) sang SVG (.svg)
# Hỗ trợ cả Docker (khuyên dùng) và PlantUML jar local.
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"

echo "🎨 Đang tìm kiếm các file PlantUML (*.puml) trong docs/..."

PUML_FILES=$(find "$ROOT/docs" -type f -name "*.puml")

if [ -z "$PUML_FILES" ]; then
  echo "⚠️ Không tìm thấy file .puml nào trong docs/"
  exit 0
fi

# 1. Thử dùng Docker nếu có
if command -v docker &> /dev/null && docker info &> /dev/null; then
  echo "🐳 Tìm thấy Docker! Đang kết xuất sơ đồ bằng container plantuml/plantuml..."
  for file in $PUML_FILES; do
    rel_path="${file#$ROOT/}"
    echo "  ➔ Đang xử lý: $rel_path"
    docker run --rm -v "$ROOT":/workspace -w /workspace plantuml/plantuml -tsvg "$rel_path"
  done
  echo "✅ Đã kết xuất toàn bộ sơ đồ sang SVG bằng Docker thành công!"
  exit 0
fi

# 2. Thử dùng lệnh plantuml trực tiếp
if command -v plantuml &> /dev/null; then
  echo "☕ Tìm thấy lệnh plantuml cài sẵn trên máy!"
  for file in $PUML_FILES; do
    echo "  ➔ Đang xử lý: $file"
    plantuml -tsvg "$file"
  done
  echo "✅ Đã kết xuất toàn bộ sơ đồ sang SVG thành công!"
  exit 0
fi

echo "❌ Không tìm thấy Docker hoặc công cụ plantuml."
echo "👉 Hướng dẫn cài đặt:"
echo "   - Cách 1: Khởi động Docker Desktop (khuyên dùng, không cần cài Java)."
echo "   - Cách 2: Tải plantuml.jar hoặc cài gói plantuml (yêu cầu Java + Graphviz)."
exit 1
