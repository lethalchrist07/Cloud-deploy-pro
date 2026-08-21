# Monitoring

This directory contains monitoring configurations and dashboards for CloudDeploy Pro.

## Contents

- CloudWatch dashboards (JSON)
- Custom metrics scripts
- Logging configurations

## CloudWatch Dashboards

You can import the following dashboard JSON files into Amazon CloudWatch:

- `system-dashboard.json`: Displays system metrics (CPU, memory, disk) for the EC2 instance
- `application-dashboard.json`: Displays application-specific metrics (request latency, error rates, etc.)

## Custom Metrics

The backend application publishes custom metrics to CloudWatch, including:
- Request count
- Request latency
- Error rates
- System health checks

These metrics are published by the backend using the AWS SDK (though in our simplified version, we simulate them).

## Logs

Application logs are forwarded to CloudWatch Logs via the Docker container's logging driver.

The log group is named: `/ecs/clouddeploy-pro-{environment}`

## Setting Up Monitoring

To set up monitoring for your environment:

1. Ensure the EC2 instance has the CloudWatch agent installed (it is installed via the managed policy in the IAM role).
2. Verify the IAM role includes the `CloudWatchAgentServerPolicy`.
3. The application logs are automatically collected by Docker and sent to CloudWatch Logs if the `awslogs` driver is configured. In our Terraform module, we rely on the application writing to stdout/stderr and Docker's default logging driver, which sends logs to CloudWatch when the agent is installed.

For advanced monitoring, consider:
- Creating CloudWatch alarms for high CPU usage, memory pressure, etc.
- Setting up SNS notifications for alarm states.
- Using CloudWatch Logs Insights to analyze logs.

## Example: Creating a CloudWatch Alarm

You can create an alarm for high CPU usage using the AWS CLI:

```bash
aws cloudwatch put-metric-alarm \
    --alert-name "HighCPUUtilization" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=InstanceId,Value=i-0123456789abcdef0 \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:sns:us-east-1:123456789012:clouddeploy-pro-alarms \
    --ok-actions arn:aws:sns:us-east-1:123456789012:clouddeploy-pro-alarms \
    --alarm-description "Alarm when server CPU exceeds 80%" \
    --unit Percent
```

## Dashboard JSON Examples

Below are examples of the dashboard JSON files you can import. Save them as `system-dashboard.json` and `application-dashboard.json` in this directory, then import via the CloudWatch console.

### system-dashboard.json
```json
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "view": "timeSeries",
                "stacked": false,
                "metrics": [
                    [ "AWS/EC2", "CPUUtilization", "InstanceId", "${instance_id}", { "stat": "Average", "label": "CPU Utilization" } ],
                    [ ".", "MemoryUtilization", { "stat": "Average", "label": "Memory Utilization" } ],
                    [ ".", "DiskUtilization", { "stat": "Average", "label": "Disk Utilization" } ]
                ],
                "region": "us-east-1",
                "title": "System Utilization",
                "period": 300
            }
        }
    ]
}
```

### application-dashboard.json
```json
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "view": "timeSeries",
                "stacked": false,
                "metrics": [
                    [ "CloudDeployPro", "RequestCount", { "stat": "Sum", "label": "Requests per Minute" } ],
                    [ "CloudDeployPro", "RequestLatency", { "stat": "Average", "label": "Average Latency (ms)" } ],
                    [ "CloudDeployPro", "ErrorRate", { "stat": "Average", "label": "Error Rate (%)" } ]
                ],
                "region": "us-east-1",
                "title": "Application Metrics",
                "period": 60
            }
        },
        {
            "type": "log",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "query": "FIELD @timestamp | SORT @timestamp DESC | LIMIT 20",
                "region": "us-east-1",
                "title": "Recent Application Logs",
                "view": "table",
                "logGroupNames": [ "/ecs/clouddeploy-pro-${environment}" ]
            }
        }
    ]
}
```