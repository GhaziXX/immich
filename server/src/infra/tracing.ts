import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { ExplicitBucketHistogramAggregation, View } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OpenTelemetryModuleOptions } from 'nestjs-otel/lib/interfaces';
import { serverVersion } from '@app/domain/domain.constant';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const aggregation = new ExplicitBucketHistogramAggregation(
  [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  true,
);

const otelSDK = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: `immich`,
    [SemanticResourceAttributes.SERVICE_VERSION]: serverVersion.toString(),
  }),
  metricReader: new PrometheusExporter({ port: 8081 }),
  contextManager: new AsyncLocalStorageContextManager(),
  instrumentations: [new HttpInstrumentation(), new IORedisInstrumentation(), new NestInstrumentation()],
  views: [new View({ aggregation, instrumentName: '*', instrumentUnit: 'ms' })],
});

export const otelConfig: OpenTelemetryModuleOptions = {
  metrics: {
    hostMetrics: true, // Includes Host Metrics
    apiMetrics: {
      enable: true, // Includes api metrics
      ignoreRoutes: ['/favicon.ico', '/custom.css'],
      ignoreUndefinedRoutes: false, //Records metrics for all URLs, even undefined ones
    },
  },
};

export default otelSDK;
