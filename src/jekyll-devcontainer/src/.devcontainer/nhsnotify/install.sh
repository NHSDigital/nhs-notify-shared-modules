#!/bin/bash

set -euo pipefail

cp ./postcreatecommand.sh /postcreatecommand.sh

cp ~/.zshrc /.zshrc
mise_version="v2026.10.17"
case "$(uname -m)" in
  x86_64)
    arch="x64"
    sha256="17565e268c5542d8ce944321e17af81e0b741b65af4aa7e8e010ee77376a4aa3"
    ;;
  aarch64 | arm64)
    arch="arm64"
    sha256="cac510e51793ad45e65fe92305bdbe4309c9c60b5907badbc7eba111738ab08f"
    ;;
  *)
    echo "Unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac
archive="mise-${mise_version}-linux-${arch}.tar.gz"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT
curl -fsSL --proto '=https' --tlsv1.2 \
  --output "${tmp_dir}/${archive}" \
  "https://github.com/jdx/mise/releases/download/${mise_version}/${archive}"
echo "${sha256}  ${tmp_dir}/${archive}" | sha256sum --check --status
mkdir -p /usr/local/bin
tar -xzf "${tmp_dir}/${archive}" -C "${tmp_dir}"
install -m 0755 "${tmp_dir}/mise/bin/mise" /usr/local/bin/mise
echo 'eval "$(mise activate zsh)"' >> /.zshrc
sed -i "/plugins=/c\plugins=(git ssh-agent sudo terraform dirhistory zsh-autosuggestions)" /.zshrc

cat /.zshrc

cp /.zshrc ~/.zshrc
export PATH="${HOME}/.local/share/mise/shims:${PATH}"
export PATH="/.local/bin:/.local/share/mise/shims:${PATH}"
source ~/.zshrc
mkdir -p /zsh/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-autosuggestions /zsh/plugins/zsh-autosuggestions
