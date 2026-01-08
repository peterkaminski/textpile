#!/bin/bash
# Setup Durable Object binding for Cloudflare Pages
# This script uses the Cloudflare API to configure DO bindings

set -e

echo "=== Cloudflare Pages Durable Object Setup ==="
echo ""

# Check for required tools
if ! command -v curl &> /dev/null; then
    echo "Error: curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Warning: jq not found. Install it for better output formatting."
    echo "  macOS: brew install jq"
    echo "  Linux: apt-get install jq"
fi

# Get configuration
read -p "Enter your Cloudflare Account ID: " ACCOUNT_ID
echo ""
echo "You need a Cloudflare API Token with these permissions:"
echo "  - Account.Workers Scripts: Edit"
echo "  - Account.Cloudflare Pages: Edit"
echo ""
echo "Create one at: https://dash.cloudflare.com/profile/api-tokens"
echo ""
read -sp "Enter your Cloudflare API Token: " API_TOKEN
echo ""
echo ""

PROJECT_NAME="textpile"
DO_CLASS="PostIdAllocator"
BINDING_NAME="POST_ID_ALLOCATOR"

echo "Configuration:"
echo "  Account ID: $ACCOUNT_ID"
echo "  Project: $PROJECT_NAME"
echo "  DO Class: $DO_CLASS"
echo "  Binding: $BINDING_NAME"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Step 1: Create Durable Object namespace
echo ""
echo "Step 1: Creating Durable Object namespace..."

NAMESPACE_RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/durable_objects/namespaces" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "POST_ID_ALLOCATOR",
    "script_name": "'"$PROJECT_NAME"'",
    "class_name": "'"$DO_CLASS"'"
  }')

if command -v jq &> /dev/null; then
    echo "$NAMESPACE_RESPONSE" | jq '.'

    if echo "$NAMESPACE_RESPONSE" | jq -e '.success' | grep -q true; then
        NAMESPACE_ID=$(echo "$NAMESPACE_RESPONSE" | jq -r '.result.id')
        echo ""
        echo "✅ Durable Object namespace created!"
        echo "   Namespace ID: $NAMESPACE_ID"
    else
        echo ""
        echo "❌ Failed to create DO namespace"
        echo "Response: $NAMESPACE_RESPONSE"
        exit 1
    fi
else
    echo "$NAMESPACE_RESPONSE"
    # Try to extract ID without jq
    NAMESPACE_ID=$(echo "$NAMESPACE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$NAMESPACE_ID" ]; then
        echo ""
        echo "✅ Namespace created: $NAMESPACE_ID"
    else
        echo ""
        echo "⚠️  Could not parse response. Install jq for better output."
        exit 1
    fi
fi

# Step 2: Add binding to Pages project
echo ""
echo "Step 2: Adding DO binding to Pages project..."
echo ""
echo "⚠️  Note: You still need to add this binding in the Cloudflare Dashboard:"
echo ""
echo "1. Go to: https://dash.cloudflare.com/pages"
echo "2. Click on your '$PROJECT_NAME' project"
echo "3. Go to: Settings → Functions"
echo "4. Scroll to: Durable Object bindings"
echo "5. Click: Add binding"
echo "6. Enter:"
echo "   - Variable name: $BINDING_NAME"
echo "   - Durable Object namespace: $NAMESPACE_ID (should appear in dropdown now)"
echo "7. Save"
echo "8. Trigger a new deployment (push to GitHub)"
echo ""
echo "The namespace has been created and should now appear in the dropdown!"

echo ""
echo "=== Setup Complete ==="
