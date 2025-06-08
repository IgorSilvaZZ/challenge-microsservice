import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker-build";

const orderECRRepository = new awsx.ecr.Repository("orders-ecr", {
  forceDelete: true,
});

const orderECRToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: orderECRRepository.repository.registryId,
});

export const orderDockerImage = new docker.Image("orders-image", {
  tags: [
    pulumi.interpolate`${orderECRRepository.repository.repositoryUrl}:latest`,
  ],
  context: {
    location: "../app-orders",
  },
  push: true,
  platforms: ["linux/amd64"],
  registries: [
    {
      address: orderECRRepository.repository.repositoryUrl,
      username: orderECRToken.userName,
      password: orderECRToken.password,
    },
  ],
});
