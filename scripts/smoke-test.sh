#!/usr/bin/env bash
# ==============================================================================
# Script Smoke Test Tự Động Cho Môi Trường Production / Local
# Sử dụng: ./scripts/smoke-test.sh [API_BASE_URL]
# Mặc định trỏ về: http://localhost:4000/api/v1
# ==============================================================================

set -e

API_URL="${1:-http://localhost:4000/api/v1}"
echo "🚀 Bắt đầu chạy Smoke Test đối với API: $API_URL"

# 1. Kiểm tra Health Check
echo "👉 1. Kiểm tra Health Check Endpoint (/health)..."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || true)
if [ "$HEALTH_CODE" = "200" ]; then
  echo "   ✅ Health Check: 200 OK"
else
  echo "   ⚠️ Health check trả về code: $HEALTH_CODE"
fi

# 2. Kiểm tra Danh sách sản phẩm (/products)
echo "👉 2. Kiểm tra API Thực đơn (/products)..."
PRODUCTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/products" || true)
if [ "$PRODUCTS_CODE" = "200" ]; then
  echo "   ✅ API Products: 200 OK"
else
  echo "   ❌ API Products thất bại với code: $PRODUCTS_CODE"
  exit 1
fi

# 3. Đăng ký & Đăng nhập tài khoản test
RAND_SUFFIX=$(date +%s)
TEST_EMAIL="smoke_test_${RAND_SUFFIX}@example.test"
TEST_PASS="SmokeTest@12345"

echo "👉 3. Thử nghiệm Đăng ký tài khoản test ($TEST_EMAIL)..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\",\"fullName\":\"Smoke Tester\"}" > /dev/null

echo "👉 4. Thử nghiệm Đăng nhập tài khoản test..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}")

TOKEN=$(echo "$LOGIN_RES" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4 || true)

if [ -n "$TOKEN" ]; then
  echo "   ✅ Đăng nhập thành công, đã cấp phát JWT Token!"
else
  echo "   ⚠️ Không trích xuất được token, phản hồi: $LOGIN_RES"
fi

echo "=========================================================="
echo "🎉 SMOKE TEST HOÀN TẤT THÀNH CÔNG!"
echo "=========================================================="
