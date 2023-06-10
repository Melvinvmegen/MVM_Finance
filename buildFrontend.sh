#!/bin/bash
cd frontend/
rm -rf dist

IMAGE_NAME="melvinvmegen/mvm_finance_front"
VERSION=$(git tag --points-at HEAD)
if [ "$VERSION" == "" ];
then 
	GIT_BRANCH=$(git branch | grep \* | cut -d ' ' -f2)
	VERSION="latest"
fi

echo "Building docker image $IMAGE_NAME:$VERSION"
if ! type docker > /dev/null;
then 
	echo "Docker not found. Please install docker to build docker image"
	exit -1
fi

echo "Build App ..."
yarn install
yarn run build

echo "Building docker image ..."
docker build -t "$IMAGE_NAME:$VERSION" .

if [[ -z "$DOCKER_USERNAME" ]] || [[ -z "$DOCKER_PASSWORD" ]];
then
	echo "Docker idents not found. Please DOCKER_USERNAME and DOCKER_PASSWORD environment variables are needed to be able to push"
	exit -1
fi

echo "Pushing docker image ..."
docker login -u "$DOCKER_USERNAME" -p "$DOCKER_PASSWORD"
docker push "$IMAGE_NAME:$VERSION"
