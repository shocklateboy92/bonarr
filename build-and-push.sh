#!/bin/bash

set -e

# Configuration
REGISTRY="registry.apps.lasath.com"
IMAGE_NAME="bonarr"
TAG="latest"
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building and pushing Docker image: ${FULL_IMAGE_NAME}${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Build the Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t "${FULL_IMAGE_NAME}" .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build Docker image${NC}"
    exit 1
fi

# Push the Docker image
echo -e "${YELLOW}Pushing Docker image to registry...${NC}"
docker push "${FULL_IMAGE_NAME}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image pushed successfully to ${FULL_IMAGE_NAME}${NC}"
else
    echo -e "${RED}✗ Failed to push Docker image${NC}"
    exit 1
fi

# Optional: Clean up local image to save space
read -p "Do you want to remove the local Docker image to save space? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker rmi "${FULL_IMAGE_NAME}"
    echo -e "${GREEN}✓ Local Docker image removed${NC}"
fi

echo -e "${GREEN}Deploy completed successfully!${NC}"
echo -e "Image available at: ${FULL_IMAGE_NAME}"