import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

import { cluster } from "../cluster";
import { orderDockerImage } from "../images/orders";
import { amqpListener } from "./rabbitmq";
import { appLoadBalancer } from "../load-balancer";

const ordersTargetGroup = appLoadBalancer.createTargetGroup("orders-target", {
  port: 3333,
  protocol: "HTTP",
  healthCheck: {
    path: "/health",
    protocol: "HTTP",
  },
});

export const orderHttpListener = appLoadBalancer.createListener(
  "orders-listener",
  {
    port: 3333,
    protocol: "HTTP",
    targetGroup: ordersTargetGroup,
  }
);

export const ordersService = new awsx.classic.ecs.FargateService(
  "farget-orders",
  {
    cluster,
    desiredCount: 1,
    waitForSteadyState: false,
    taskDefinitionArgs: {
      container: {
        image: orderDockerImage.ref,
        cpu: 256,
        memory: 512,
        portMappings: [orderHttpListener],
        environment: [
          {
            name: "BROKER_URL",
            value: pulumi.interpolate`amqp://admin:admin@${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}`,
          },
          {
            name: "DATABASE_URL",
            value: "url_database_neon",
          },
          {
            name: "OTEL_TRACES_EXPORTS",
            value: "env_grafana",
          },
          {
            name: "OTEL_EXPORTER_OTLP_ENDPOINT",
            value: "env_grafana",
          },
          {
            name: "OTEL_EXPORTER_OTLP_HEADERS",
            value: "env_grafana",
          },
          {
            name: "OTEL_RESOURCE_ATTRIBUTES",
            value: "env_grafana",
          },
          {
            name: "OTEL_SERVICE_NAME",
            value: "env_grafana",
          },
          {
            name: "OTEL_NODE_RESOURCE_DETECTORS",
            value: "env_grafana",
          },
          {
            name: "OTEL_NODE_ENABLED_INSTRUMENTATIONS",
            value: "http,fastify,pg,amqplib",
          },
        ],
      },
    },
  }
);
