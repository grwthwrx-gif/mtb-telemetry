#!/bin/bash
set -e

echo "🔑 Setting up SSH for GitHub..."

# 1️⃣ Generate SSH key (ed25519 is recommended, RSA as fallback if needed)
if [ ! -f ~/.ssh/id_ed25519 ]; then
  echo "📌 Generating new SSH key..."
  ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519 -N ""
else
  echo "✅ SSH key already exists, skipping generation."
fi

# 2️⃣ Start ssh-agent
echo "🚀 Starting ssh-agent..."
eval "$(ssh-agent -s)"

# 3️⃣ Add SSH key to agent
ssh-add ~/.ssh/id_ed25519

# 4️⃣ Show public key for GitHub
echo "📋 Copy the following key and add it to GitHub (Settings → SSH and GPG keys):"
cat ~/.ssh/id_ed25519.pub

echo ""
echo "👉 Next steps:"
echo "1. Copy the key above."
echo "2. Go to https://github.com/settings/keys"
echo "3. Click 'New SSH key', paste it, and save."
echo ""
echo "⚡ Once added, run:"
echo "   git remote set-url origin git@github.com:grwthwrx-gif/mtb-telemetry.git"
echo "   ssh -T git@github.com"
echo ""
echo "✅ You should see: 'Hi grwthwrx-gif! You've successfully authenticated...'"
