#!/bin/bash
cd backend/

IMAGE_NAME="melvinvmegen/mvm_finance_backend"
VERSION=$(git tag --points-at HEAD)
if [ "$VERSION" == "" ];
then 
	GIT_BRANCH=$(git branch | grep \* | cut -d ' ' -f2)
	VERSION="latest-$GIT_BRANCH"
fi

echo "Building docker image $IMAGE_NAME:$VERSION"
if ! type docker > /dev/null;
then 
	echo "Docker not found. Please install docker to build docker image"
	exit -1
fi

echo "Building docker image ..."
docker build -t "$IMAGE_NAME:$VERSION" .

if [[ -z "${{ secrets.DOCKER_USERNAME }}" ]] || [[ -z "${{ secrets.DOCKER_PASSWORD }}" ]];
then
	echo "Docker idents not found. Please DOCKER_USERNAME and DOCKER_PASSWORD environment variables are needed to be able to push"
	exit -1
fi

echo "Pushing docker image ..."
docker login -u "${{ secrets.DOCKER_USERNAME }}" -p "${{ secrets.DOCKER_PASSWORD }}"
docker push "$IMAGE_NAME:$VERSION"