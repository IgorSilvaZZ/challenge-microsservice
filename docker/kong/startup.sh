#!/bin/bash
set -e

echo "Kong Custom Entrypoint: Processing configuration template..."

ls /kong

if [ -f "/kong/config.template.yaml" ]; then
    echo "Found template file, generating configuration..."

    envsubst < /kong/config.template.yaml > /kong/config.yaml

    export KONG_DECLARATIVE_CONFIG=/kong/config.yaml
else
    echo "No template file found at /kong/config.template.yaml"
    echo "Using existing configuration or default settings"
fi

# Importa a lógica de startup do Kong original
. /docker-entrypoint.sh
