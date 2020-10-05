import * as cdk from "@aws-cdk/core"
import * as ec2 from "@aws-cdk/aws-ec2"
import * as ecs from "@aws-cdk/aws-ecs"
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns"


export class AwsCdkFargateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, "VPC")

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    })

    const loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "Service", {
      cluster,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      cpu: 512,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset("./local-image"),
      },
    })

    const scalableTarget = loadBalancedFargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 20,
    })

    scalableTarget.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 50,
    })

    scalableTarget.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 50,
    })
  }
}
