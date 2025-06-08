import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

import { cluster } from "../cluster";
import { appLoadBalancer, networkLoadBalancer } from "../load-balancer";
import { orderHttpListener } from "./orders";
import { kongDockerImage } from "../images/kong";

const proxyTargetGroup = appLoadBalancer.createTargetGroup("proxy-target", {
  port: 8000,
  protocol: "HTTP",
  healthCheck: {
    path: "/orders/health",
    protocol: "HTTP",
  },
});

export const proxyHttpListener = appLoadBalancer.createListener(
  "proxy-listener",
  {
    port: 80,
    protocol: "HTTP",
    targetGroup: proxyTargetGroup,
  }
);

const adminTargetGroup = appLoadBalancer.createTargetGroup("admin-target", {
  port: 8002,
  protocol: "HTTP",
  healthCheck: {
    path: "/",
    protocol: "HTTP",
  },
});

export const adminHttpListener = appLoadBalancer.createListener(
  "admin-listener",
  {
    port: 8002,
    protocol: "HTTP",
    targetGroup: adminTargetGroup,
  }
);

const adminApiTargetGroup = appLoadBalancer.createTargetGroup(
  "admin-api-target",
  {
    port: 8001,
    protocol: "HTTP",
    healthCheck: {
      path: "/",
      protocol: "HTTP",
    },
  }
);

export const adminApiHttpListener = appLoadBalancer.createListener(
  "admin-api-listener",
  {
    port: 8001,
    protocol: "HTTP",
    targetGroup: adminApiTargetGroup,
  }
);

export const kongService = new awsx.classic.ecs.FargateService("farget_kong", {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: kongDockerImage.ref,
      cpu: 256,
      memory: 512,
      portMappings: [adminHttpListener, adminApiHttpListener],
      environment: [
        { name: "KONG_DATABASE", value: "off" },
        {
          name: "ORDERS_SERVICE_URL",
          value: pulumi.interpolate`http://${orderHttpListener.endpoint.hostname}:${orderHttpListener.endpoint.port}`,
        },
      ],
    },
  },
});
