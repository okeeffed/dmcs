#!/bin/bash

set -e

AWS_ACCESS_KEY_ID='test'
AWS_SECRET_KEY='test'
AWS_REGION='us-east-1'

# Step 1: Run docker compose up
echo "Starting LocalStack with Docker Compose..."
docker compose up -d

# Step 2: Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
while ! curl -s http://localhost:4566/_localstack/health | grep -q '"dynamodb": "available"'; do
	echo "Waiting for LocalStack..."
	sleep 5
done
echo "LocalStack is ready."

# Step 3: Run AWS CDK commands in the infra directory
echo "Running AWS CDK commands in the infra directory..."
(
	cd infra || exit
	pnpm cdk-local synth
	pnpm cdk-local bootstrap --force
	pnpm cdk-local deploy
)

# Step 5: Run the seed code
echo "Running seed code..."
pnpm seed

echo "Setup complete."
